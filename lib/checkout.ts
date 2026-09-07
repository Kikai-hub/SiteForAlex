import { prisma } from "@/lib/prisma";

export class CheckoutItemError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

export interface PricedCartItem {
  dishId: string;
  dishVariantId: string;
  nameSnapshot: string;
  variantLabelSnapshot: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  /** Snapshotted from Dish.bonusRedeemable at price time — determines whether
   *  this line counts toward the order's bonus-points-eligible subtotal. */
  bonusRedeemable: boolean;
  extras: { dishExtraId: string; nameSnapshot: string; unitPriceMinor: number; quantity: number }[];
}

/**
 * Re-fetches live variant/extra prices and availability for a cart's items —
 * client-supplied prices are never trusted. Shared by order creation
 * (app/api/orders/route.ts) and the bonus-points checkout preview
 * (app/api/bonus/preview/route.ts) so both price a cart identically and agree
 * on which lines are bonus-eligible.
 */
export async function priceCartItems(
  items: { dishVariantId: string; quantity: number; extras: { dishExtraId: string; quantity: number }[] }[]
): Promise<PricedCartItem[]> {
  const variantIds = items.map((i) => i.dishVariantId);
  const variants = await prisma.dishVariant.findMany({
    where: { id: { in: variantIds } },
    include: { dish: true },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const extraIds = items.flatMap((i) => i.extras.map((e) => e.dishExtraId));
  const dishExtras = await prisma.dishExtra.findMany({ where: { id: { in: extraIds } } });
  const extraMap = new Map(dishExtras.map((e) => [e.id, e]));

  const priced: PricedCartItem[] = [];

  for (const item of items) {
    const variant = variantMap.get(item.dishVariantId);
    if (!variant || !variant.isActive || !variant.dish.isActive) {
      throw new CheckoutItemError(`Позиция «${variant?.dish.name ?? "неизвестно"}» больше недоступна`);
    }

    // Aggregate by dishExtraId first — checking maxQuantity per raw array
    // entry would let the same extra be split across multiple entries
    // (e.g. two {dishExtraId:"X",quantity:1} for a maxQuantity:1 extra) to
    // bypass the admin-configured cap.
    const requestedQuantities = new Map<string, number>();
    for (const extraSel of item.extras) {
      requestedQuantities.set(
        extraSel.dishExtraId,
        (requestedQuantities.get(extraSel.dishExtraId) ?? 0) + extraSel.quantity
      );
    }

    const itemExtrasData: PricedCartItem["extras"] = [];
    for (const [dishExtraId, quantity] of requestedQuantities) {
      const extra = extraMap.get(dishExtraId);
      if (!extra || !extra.isActive || extra.dishId !== variant.dishId) {
        throw new CheckoutItemError(`Доп «${extra?.name ?? "неизвестно"}» больше недоступен`);
      }
      if (quantity > extra.maxQuantity) {
        throw new CheckoutItemError(`Максимум «${extra.name}»: ${extra.maxQuantity}`);
      }
      itemExtrasData.push({
        dishExtraId: extra.id,
        nameSnapshot: extra.name,
        unitPriceMinor: extra.priceMinor,
        quantity,
      });
    }

    const extrasUnitTotal = itemExtrasData.reduce((sum, e) => sum + e.unitPriceMinor * e.quantity, 0);

    priced.push({
      dishId: variant.dishId,
      dishVariantId: variant.id,
      nameSnapshot: variant.dish.name,
      variantLabelSnapshot: variant.label,
      unitPriceMinor: variant.priceMinor,
      quantity: item.quantity,
      lineTotalMinor: (variant.priceMinor + extrasUnitTotal) * item.quantity,
      bonusRedeemable: variant.dish.bonusRedeemable,
      extras: itemExtrasData,
    });
  }

  return priced;
}

export function cartTotals(items: PricedCartItem[]) {
  const subtotalMinor = items.reduce((sum, i) => sum + i.lineTotalMinor, 0);
  const eligibleSubtotalMinor = items
    .filter((i) => i.bonusRedeemable)
    .reduce((sum, i) => sum + i.lineTotalMinor, 0);
  return { subtotalMinor, eligibleSubtotalMinor };
}
