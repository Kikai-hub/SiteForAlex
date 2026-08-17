import { prisma } from "@/lib/prisma";
import type { DishCardData } from "@/components/site/DishCard";

/** Below this many real orders site-wide, co-purchase data is too thin to be
 *  meaningful — the recommendations strip stays hidden until then. */
export const MIN_ORDERS_FOR_RECOMMENDATIONS = 30;

const COUNTABLE_ORDER = { status: { not: "CANCELLED" as const } };

/** Ranks other dishes for "often ordered with this one": first by how often they
 *  co-occur in the same order as `dishId`, then backfills with the site's overall
 *  best-sellers (excluding dishes already picked and the current dish). Returns []
 *  below the order-volume threshold, or once the dish itself has never been
 *  ordered and there aren't enough overall sales to backfill either. */
export async function getRecommendedDishIds(dishId: string, limit = 8): Promise<string[]> {
  const orderCount = await prisma.order.count({ where: COUNTABLE_ORDER });
  if (orderCount < MIN_ORDERS_FOR_RECOMMENDATIONS) return [];

  const ordersWithDish = await prisma.orderItem.findMany({
    where: { dishId, order: COUNTABLE_ORDER },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const orderIds = ordersWithDish.map((o) => o.orderId);

  const coOccurring = orderIds.length
    ? await prisma.orderItem.groupBy({
        by: ["dishId"],
        where: { orderId: { in: orderIds } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
      })
    : [];
  const coIds = coOccurring
    .map((g) => g.dishId)
    .filter((id): id is string => !!id && id !== dishId);

  const picked = coIds.slice(0, limit);
  if (picked.length >= limit) return picked;

  const popular = await prisma.orderItem.groupBy({
    by: ["dishId"],
    where: { order: COUNTABLE_ORDER },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
  });
  const excluded = new Set([dishId, ...picked]);
  const popularIds = popular
    .map((g) => g.dishId)
    .filter((id): id is string => !!id && !excluded.has(id));

  return [...picked, ...popularIds.slice(0, limit - picked.length)];
}

/** Recommendation ids ranked by getRecommendedDishIds, then hydrated into card
 *  data — skipping any dish that's since been deactivated or deleted, since the
 *  order history that ranked it doesn't guarantee it's still sellable today. */
export async function getRecommendedDishCards(dishId: string, limit = 8): Promise<DishCardData[]> {
  const ids = await getRecommendedDishIds(dishId, limit);
  if (ids.length === 0) return [];

  const dishes = await prisma.dish.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
  });
  const byId = new Map(dishes.map((d) => [d.id, d]));

  const ratingGroups = await prisma.comment.groupBy({
    by: ["dishId"],
    where: { status: "APPROVED", dishId: { in: ids } },
    _avg: { rating: true },
    _count: true,
  });
  const ratingByDishId = new Map(
    ratingGroups.map((g) => [g.dishId, { avg: g._avg.rating ?? 0, count: g._count }])
  );

  return ids.flatMap((id) => {
    const dish = byId.get(id);
    if (!dish || dish.variants.length === 0) return [];
    return [
      {
        id: dish.id,
        name: dish.name,
        description: dish.description,
        imageUrl: dish.media[0]?.url ?? null,
        variants: dish.variants.map((v) => ({ id: v.id, label: v.label, priceMinor: v.priceMinor })),
        rating: ratingByDishId.get(dish.id) ?? null,
      },
    ];
  });
}
