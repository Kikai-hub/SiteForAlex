/** Regenerates prisma/seed-data/{menu.json,media/**} from the current local
 *  database — the "starter menu" a fresh production install loads once (see
 *  prisma/seed-initial-menu.ts). Run this after building out the real menu
 *  locally and wanting a new server install to start from that state.
 *
 *  Does NOT touch orders/customers/couriers/comments — only the catalog
 *  (categories, dishes, variants, extras, photos).
 */
import "dotenv/config";
import { mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";

const SEED_DATA_DIR = path.join(process.cwd(), "prisma", "seed-data");
const MEDIA_OUT_DIR = path.join(SEED_DATA_DIR, "media");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "dishes");

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const dishes = await prisma.dish.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      extras: { orderBy: { sortOrder: "asc" } },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });

  await rm(MEDIA_OUT_DIR, { recursive: true, force: true });
  await mkdir(MEDIA_OUT_DIR, { recursive: true });

  let copiedFiles = 0;
  for (const dish of dishes) {
    for (const m of dish.media) {
      if (!m.url.startsWith("/uploads/dishes/")) continue;
      const relative = m.url.replace("/uploads/dishes/", "");
      const src = path.join(UPLOADS_ROOT, relative);
      const dest = path.join(MEDIA_OUT_DIR, relative);
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(src, dest);
      copiedFiles += 1;
    }
  }

  const snapshot = {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    })),
    dishes: dishes.map((d) => ({
      id: d.id,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      caloriesPer100g: d.caloriesPer100g,
      proteinPer100g: d.proteinPer100g,
      fatPer100g: d.fatPer100g,
      carbsPer100g: d.carbsPer100g,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
      variants: d.variants.map((v) => ({
        id: v.id,
        label: v.label,
        priceMinor: v.priceMinor,
        weightGrams: v.weightGrams,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
      })),
      extras: d.extras.map((e) => ({
        id: e.id,
        name: e.name,
        priceMinor: e.priceMinor,
        maxQuantity: e.maxQuantity,
        sortOrder: e.sortOrder,
        isActive: e.isActive,
        featured: e.featured,
      })),
      media: d.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        isPrimary: m.isPrimary,
        sortOrder: m.sortOrder,
      })),
    })),
  };

  await writeFile(path.join(SEED_DATA_DIR, "menu.json"), JSON.stringify(snapshot, null, 2));

  console.log(
    `Wrote ${categories.length} categories, ${dishes.length} dishes, ${copiedFiles} media files to prisma/seed-data/.`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
