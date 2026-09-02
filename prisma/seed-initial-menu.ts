/** Loads the starter menu (prisma/seed-data/) into an EMPTY database only —
 *  runs on every `migrate` (see docker-compose.yml) but no-ops the instant
 *  any category exists, so it never overwrites what an admin has since
 *  changed. To ship a different starting menu, regenerate the snapshot with
 *  scripts/export-menu-snapshot.ts and redeploy. */
import "dotenv/config";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_DATA_DIR = path.join(process.cwd(), "prisma", "seed-data");
const MEDIA_SRC_DIR = path.join(SEED_DATA_DIR, "media");
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "dishes");

interface SnapshotVariant {
  id: string;
  label: string;
  priceMinor: number;
  weightGrams: number | null;
  sortOrder: number;
  isActive: boolean;
}
interface SnapshotExtra {
  id: string;
  name: string;
  priceMinor: number;
  maxQuantity: number;
  sortOrder: number;
  isActive: boolean;
  featured: boolean;
}
interface SnapshotMedia {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}
interface SnapshotDish {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  isActive: boolean;
  sortOrder: number;
  variants: SnapshotVariant[];
  extras: SnapshotExtra[];
  media: SnapshotMedia[];
}
interface SnapshotCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}
interface Snapshot {
  categories: SnapshotCategory[];
  dishes: SnapshotDish[];
}

async function main() {
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log("Menu already has data — skipping initial seed.");
    return;
  }

  const snapshot: Snapshot = JSON.parse(readFileSync(path.join(SEED_DATA_DIR, "menu.json"), "utf-8"));

  // Copy photos first — harmless to redo/duplicate if this step is ever
  // retried, unlike the DB writes below (which are all-or-nothing).
  for (const dish of snapshot.dishes) {
    for (const m of dish.media) {
      if (!m.url.startsWith("/uploads/dishes/")) continue;
      const relative = m.url.replace("/uploads/dishes/", "");
      const src = path.join(MEDIA_SRC_DIR, relative);
      const dest = path.join(UPLOADS_ROOT, relative);
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(src, dest);
    }
  }

  // Everything else in one transaction: either the whole starter menu lands,
  // or none of it does — so `category.count()` above never sees a half-
  // seeded state and silently skips a retry after a crash mid-seed.
  await prisma.$transaction(async (tx) => {
    for (const c of snapshot.categories) {
      await tx.category.create({ data: c });
    }
    for (const d of snapshot.dishes) {
      await tx.dish.create({
        data: {
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
          variants: { create: d.variants },
          extras: { create: d.extras },
          media: { create: d.media },
        },
      });
    }
  });

  console.log(
    `Seeded starter menu: ${snapshot.categories.length} categories, ${snapshot.dishes.length} dishes.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
