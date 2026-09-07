import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/customer";
import { createOrderSchema } from "@/lib/validation/order";
import { normalizePhone } from "@/lib/phone";
import { validatePromoCode } from "@/lib/promo";
import { priceCartItems, cartTotals, CheckoutItemError } from "@/lib/checkout";
import { previewBonusRedemption, redeemBonusPoints, BONUS_INSUFFICIENT, BONUS_CAP_EXCEEDED } from "@/lib/bonus";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const guestPhone = normalizePhone(data.guestPhone);
  if (!guestPhone) {
    return NextResponse.json({ error: "Некорректный номер телефона" }, { status: 400 });
  }

  const session = await getCustomerSession();
  const customerId = session?.sub ?? null;
  // Bonus points are only ever redeemed against the authenticated account's own
  // phone — never a phone number just typed into the contact field — so a
  // logged-in customer can't spend another phone's balance by editing it, and a
  // guest checkout (no session) can't redeem at all, only earn.
  const customer = customerId ? await prisma.customer.findUnique({ where: { id: customerId } }) : null;
  // If the client asked to spend points but the session turned out to be
  // missing/expired by the time this request landed, fail loudly instead of
  // silently charging full price — the checkout screen already showed the
  // customer a lower total with the bonus discount applied, so quietly
  // dropping it here would charge more than what they saw and agreed to.
  if (!customer && data.useBonusPoints) {
    return NextResponse.json(
      { error: "Сессия истекла — войдите в аккаунт заново, чтобы использовать баллы, либо оформите заказ без них" },
      { status: 401 }
    );
  }

  let orderItemsData;
  try {
    orderItemsData = await priceCartItems(data.items);
  } catch (e) {
    if (e instanceof CheckoutItemError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { subtotalMinor, eligibleSubtotalMinor } = cartTotals(orderItemsData);

  let addressFields: {
    addressCity?: string | null;
    addressStreet?: string | null;
    addressHouse?: string | null;
    addressApartment?: string | null;
    addressEntrance?: string | null;
    addressFloor?: string | null;
    addressComment?: string | null;
  } = {};

  if (data.fulfillmentType === "DELIVERY") {
    if (data.addressId) {
      const savedAddress = await prisma.address.findUnique({ where: { id: data.addressId } });
      if (!savedAddress || savedAddress.customerId !== customerId) {
        return NextResponse.json({ error: "Адрес не найден" }, { status: 404 });
      }
      addressFields = {
        addressCity: savedAddress.city,
        addressStreet: savedAddress.street,
        addressHouse: savedAddress.house,
        addressApartment: savedAddress.apartment,
        addressEntrance: savedAddress.entrance,
        addressFloor: savedAddress.floor,
        addressComment: savedAddress.comment,
      };
    } else if (data.address?.street && data.address?.house) {
      addressFields = {
        addressCity: data.address.city || "Москва",
        addressStreet: data.address.street,
        addressHouse: data.address.house,
        addressApartment: data.address.apartment || null,
        addressEntrance: data.address.entrance || null,
        addressFloor: data.address.floor || null,
        addressComment: data.address.comment || null,
      };
    } else {
      return NextResponse.json({ error: "Укажите адрес доставки" }, { status: 400 });
    }
  }

  let discountMinor = 0;
  let promoCodeId: string | null = null;
  let promoCodeSnapshot: string | null = null;
  let promoMaxUsesTotal: number | null = null;

  if (data.promoCode) {
    const result = await validatePromoCode({
      code: data.promoCode,
      subtotalMinor,
      customerId,
      guestPhone,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    discountMinor = result.discountMinor;
    promoCodeId = result.promoCodeId;
    promoCodeSnapshot = result.code;
    promoMaxUsesTotal = result.maxUsesTotal;
  }

  // Only ever redeem against the logged-in account's own phone (see the
  // `customer` lookup above) — a guest checkout can't redeem at all.
  let bonusPointsRedeemed = 0;
  let bonusDiscountMinor = 0;
  if (customer && data.useBonusPoints) {
    const bonusResult = await previewBonusRedemption({
      phone: customer.phone,
      subtotalMinor,
      discountMinor,
      eligibleSubtotalMinor,
      requestedPoints: data.useBonusPoints,
    });
    bonusPointsRedeemed = bonusResult.pointsRedeemed;
    bonusDiscountMinor = bonusResult.discountMinor;
  }

  const totalMinor = Math.max(subtotalMinor - discountMinor - bonusDiscountMinor, 0);

  const PROMO_EXHAUSTED = Symbol("PROMO_EXHAUSTED");

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId,
          guestName: data.guestName,
          guestPhone,
          fulfillmentType: data.fulfillmentType,
          paymentMethod: data.paymentMethod,
          subtotalMinor,
          discountMinor,
          totalMinor,
          promoCodeId,
          promoCodeSnapshot,
          bonusPointsRedeemed,
          bonusDiscountMinor,
          notes: data.notes || null,
          ...addressFields,
          items: {
            create: orderItemsData.map(({ extras, bonusRedeemable, ...item }) => {
              void bonusRedeemable; // pricing-only field — OrderItem has no such column
              return { ...item, extras: { create: extras } };
            }),
          },
        },
      });
      if (promoCodeId) {
        // Conditional on usedCount at update time (not the value read earlier by
        // validatePromoCode) so two concurrent orders can't both slip through
        // when maxUsesTotal is about to be reached — the DB enforces the check
        // atomically with the increment instead of trusting a stale read.
        const incremented = await tx.promoCode.updateMany({
          where: {
            id: promoCodeId,
            ...(promoMaxUsesTotal != null ? { usedCount: { lt: promoMaxUsesTotal } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (incremented.count === 0) {
          throw PROMO_EXHAUSTED;
        }
      }
      if (bonusPointsRedeemed > 0) {
        await redeemBonusPoints(tx, {
          phone: customer!.phone,
          points: bonusPointsRedeemed,
          subtotalMinor,
          discountMinor,
          eligibleSubtotalMinor,
          orderId: created.id,
        });
      }
      return created;
    });
  } catch (err) {
    if (err === PROMO_EXHAUSTED) {
      return NextResponse.json(
        { error: "Промокод только что исчерпал лимит использований — оформите заказ без него" },
        { status: 409 }
      );
    }
    if (err === BONUS_INSUFFICIENT) {
      return NextResponse.json(
        { error: "Недостаточно баллов — баланс изменился, оформите заказ без них или обновите страницу" },
        { status: 409 }
      );
    }
    if (err === BONUS_CAP_EXCEEDED) {
      return NextResponse.json(
        { error: "Лимит списания баллов изменился — обновите страницу и попробуйте снова" },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ orderId: order.id, token: order.accessToken });
}
