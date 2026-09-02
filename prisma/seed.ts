import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Creates the admin account and default promo code — safe to re-run any
 *  number of times (upserts by unique key). Does NOT touch the menu: that's
 *  prisma/seed-initial-menu.ts's job, gated so it only ever loads once into
 *  an empty database (see docker-compose.yml's `migrate` service). An
 *  earlier version of this file also seeded a handful of hardcoded
 *  placeholder dishes on every run — since dish name/category matching was
 *  never fully reliable, re-running it against a real, already-curated menu
 *  quietly created photo-less duplicate dishes. Removed rather than patched:
 *  this script has no business touching the menu at all now that
 *  seed-initial-menu.ts owns it. */
async function main() {
  if (process.env.NODE_ENV === "production" && (!process.env.SEED_ADMIN_USERNAME || !process.env.SEED_ADMIN_PASSWORD)) {
    throw new Error(
      "SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must be set in production — refusing to seed the well-known dev admin credentials."
    );
  }
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "adana-admin-2026";
  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Администратор",
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "ADANA10" },
    update: {},
    create: {
      code: "ADANA10",
      type: "PERCENT",
      value: 10,
      isActive: true,
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${adminUsername} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
