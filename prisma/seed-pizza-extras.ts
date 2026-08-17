/** One-off/rerunnable backfill: attaches the standard pizza add-ons
 *  (lib/pizzaExtras.ts) to every existing dish in the "Пиццы" category.
 *  New pizzas get these automatically on creation (see the createDish
 *  action) — this script only covers dishes that already existed. */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { DEFAULT_PIZZA_EXTRAS, PIZZA_CATEGORY_SLUG } from "../lib/pizzaExtras";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function toMinor(rubles: number) {
  return Math.round(rubles * 100);
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: PIZZA_CATEGORY_SLUG } });
  if (!category) throw new Error(`Category with slug "${PIZZA_CATEGORY_SLUG}" not found`);

  const dishes = await prisma.dish.findMany({
    where: { categoryId: category.id },
    select: { id: true, name: true, extras: { select: { name: true } } },
  });

  let created = 0;
  for (const dish of dishes) {
    const existingNames = new Set(dish.extras.map((e) => e.name));
    const missing = DEFAULT_PIZZA_EXTRAS.filter((e) => !existingNames.has(e.name));
    if (missing.length === 0) continue;

    const baseSortOrder = DEFAULT_PIZZA_EXTRAS.length - missing.length;
    await prisma.dishExtra.createMany({
      data: missing.map((extra, i) => ({
        dishId: dish.id,
        name: extra.name,
        priceMinor: toMinor(extra.priceRubles),
        maxQuantity: extra.maxQuantity,
        sortOrder: baseSortOrder + i,
        featured: extra.featured ?? false,
      })),
    });
    created += missing.length;
    console.log(`${dish.name}: +${missing.length} extras`);
  }

  console.log(`Done. ${created} extras created across ${dishes.length} pizzas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
