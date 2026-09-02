import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRecommendedDishCards } from "@/lib/recommendations";

/**
 * Public menu/homepage data (categories, dishes, prices, ratings) is read on
 * every visit but only ever changes through the admin panel — caching it here
 * means Postgres is hit once per revalidation window instead of once per page
 * view, and the hit is spread across a handful of pooled connections instead
 * of every PM2 worker querying independently (see lib/prisma.ts). Every admin
 * mutation that touches this data also calls updateTag("menu")/revalidateTag
 * so edits still show up immediately; `revalidate` below is just the safety
 * net for a mutation path that forgets to invalidate.
 */
const MENU_REVALIDATE_SECONDS = 300;

export const getHomeCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { dishes: true } },
        dishes: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
          include: { media: { orderBy: [{ isPrimary: "desc" }], take: 1 } },
        },
      },
    });
  },
  ["home-categories"],
  { tags: ["menu"], revalidate: MENU_REVALIDATE_SECONDS }
);

export const getSignatureDish = unstable_cache(
  async () => {
    return prisma.dish.findFirst({
      where: { name: "Адана", isActive: true },
      include: { variants: { orderBy: { sortOrder: "asc" } }, media: true },
    });
  },
  ["signature-dish"],
  { tags: ["menu"], revalidate: MENU_REVALIDATE_SECONDS }
);

export const getMenuCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        dishes: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
            media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
          },
        },
      },
    });
  },
  ["menu-categories"],
  { tags: ["menu"], revalidate: MENU_REVALIDATE_SECONDS }
);

export const getDishDetail = unstable_cache(
  async (dishId: string) => {
    return prisma.dish.findUnique({
      where: { id: dishId, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        extras: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  },
  ["dish-detail"],
  { tags: ["menu"], revalidate: MENU_REVALIDATE_SECONDS }
);

/** "Often ordered with this one" is derived from order history, not admin edits —
 *  a longer, purely time-based window is fine (no updateTag wired to order
 *  creation, or every checkout would blow the cache right when load is highest). */
export const getRecommendedDishCardsCached = unstable_cache(
  async (dishId: string) => getRecommendedDishCards(dishId),
  ["recommended-dishes"],
  { tags: ["recommendations"], revalidate: 900 }
);

/** Average rating + count per dish, and the full approved-review list for one
 *  dish — both change only via comment moderation in the admin panel. Scoped
 *  to active dishes since this only ever backs /menu, which never shows the
 *  rest — otherwise years of reviews on discontinued dishes would sit in
 *  every copy of this cache entry for no reader to use. */
export const getApprovedDishRatings = unstable_cache(
  async () => {
    return prisma.comment.groupBy({
      by: ["dishId"],
      where: { status: "APPROVED", dish: { isActive: true } },
      _avg: { rating: true },
      _count: true,
    });
  },
  ["approved-dish-ratings"],
  { tags: ["comments"], revalidate: MENU_REVALIDATE_SECONDS }
);

export const getDishReviews = unstable_cache(
  async (dishId: string) => {
    const [comments, aggregate] = await Promise.all([
      prisma.comment.findMany({
        where: { dishId, status: "APPROVED" },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.comment.aggregate({
        where: { dishId, status: "APPROVED" },
        _avg: { rating: true },
        _count: true,
      }),
    ]);
    return { comments, aggregate };
  },
  ["dish-reviews"],
  { tags: ["comments"], revalidate: MENU_REVALIDATE_SECONDS }
);
