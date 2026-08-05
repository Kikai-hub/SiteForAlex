import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/customer";
import { createOrderSchema } from "@/lib/validation/order";
import { normalizePhone } from "@/lib/phone";
import { validatePromoCode } from "@/lib/promo";

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

  // Re-fetch live variants — never trust prices/availability from the client.
  const variantIds = data.items.map((i) => i.dishVariantId);
  const variants = await prisma.dishVariant.findMany({
    where: { id: { in: variantIds } },
    include: { dish: true },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const orderItemsData: {
    dishId: string;
    dishVariantId: string;
    nameSnapshot: string;
    variantLabelSnapshot: string;
    unitPriceMinor: number;
    quantity: number;
    lineTotalMinor: number;
  }[] = [];

  for (const item of data.items) {
    const variant = variantMap.get(item.dishVariantId);
    if (!variant || !variant.isActive || !variant.dish.isActive) {
      return NextResponse.json(
        { error: `Позиция «${variant?.dish.name ?? "неизвестно"}» больше недоступна` },
        { status: 409 }
      );
    }
    orderItemsData.push({
      dishId: variant.dishId,
      dishVariantId: variant.id,
      nameSnapshot: variant.dish.name,
      variantLabelSnapshot: variant.label,
      unitPriceMinor: variant.priceMinor,
      quantity: item.quantity,
      lineTotalMinor: variant.priceMinor * item.quantity,
    });
  }

  const subtotalMinor = orderItemsData.reduce((sum, i) => sum + i.lineTotalMinor, 0);

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
  }

  const totalMinor = Math.max(subtotalMinor - discountMinor, 0);

  const order = await prisma.$transaction(async (tx) => {
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
        notes: data.notes || null,
        ...addressFields,
        items: { create: orderItemsData },
      },
    });
    if (promoCodeId) {
      await tx.promoCode.update({
        where: { id: promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }
    return created;
  });

  return NextResponse.json({ orderId: order.id });
}
