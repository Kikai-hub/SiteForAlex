import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth/customer";
import { priceCartItems, cartTotals, CheckoutItemError } from "@/lib/checkout";
import { previewBonusRedemption } from "@/lib/bonus";
import { validatePromoCode } from "@/lib/promo";
import { cartItemSchema } from "@/lib/validation/order";
import { z } from "zod";

const bonusPreviewSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  requestedPoints: z.coerce.number().int().nonnegative().max(1_000_000),
  /** The promo code already applied on the checkout screen, if any — re-validated
   *  here (never trusted as-is) so the bonus cap reflects what's actually still
   *  owed after it, matching how app/api/orders/route.ts computes the same thing
   *  at order-creation time. */
  promoCode: z.string().trim().optional().nullable(),
});

/** Live preview of "how many of the points I asked for can actually be
 *  applied" for the checkout screen — always recomputed server-side from the
 *  cart (see lib/checkout.ts) and re-validated again at order creation, so
 *  nothing here is trusted as the final discount. Redemption requires an
 *  authenticated account — a guest can earn points but never spend them just
 *  by typing a phone number, see app/api/orders/route.ts. */
export async function POST(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Войдите в аккаунт, чтобы использовать баллы" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bonusPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (!customer) {
    return NextResponse.json({ error: "Аккаунт не найден" }, { status: 401 });
  }

  let pricedItems;
  try {
    pricedItems = await priceCartItems(parsed.data.items);
  } catch (e) {
    if (e instanceof CheckoutItemError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { subtotalMinor, eligibleSubtotalMinor } = cartTotals(pricedItems);

  let discountMinor = 0;
  if (parsed.data.promoCode) {
    const promoResult = await validatePromoCode({
      code: parsed.data.promoCode,
      subtotalMinor,
      customerId: session.sub,
    });
    if (promoResult.ok) discountMinor = promoResult.discountMinor;
  }

  const result = await previewBonusRedemption({
    phone: customer.phone,
    subtotalMinor,
    discountMinor,
    eligibleSubtotalMinor,
    requestedPoints: parsed.data.requestedPoints,
  });

  return NextResponse.json(result);
}
