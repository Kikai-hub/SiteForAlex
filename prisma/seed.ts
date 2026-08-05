import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function rub(value: number) {
  return Math.round(value * 100);
}

async function seedCategory(name: string, slug: string, sortOrder: number) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, sortOrder },
    create: { name, slug, sortOrder },
  });
}

async function seedDish(params: {
  categoryId: string;
  name: string;
  description?: string;
  sortOrder: number;
  variants: { label: string; priceRubles: number; weightGrams?: number }[];
}) {
  const existing = await prisma.dish.findFirst({
    where: { categoryId: params.categoryId, name: params.name },
  });

  const dish = existing
    ? await prisma.dish.update({
        where: { id: existing.id },
        data: { description: params.description, sortOrder: params.sortOrder },
      })
    : await prisma.dish.create({
        data: {
          categoryId: params.categoryId,
          name: params.name,
          description: params.description,
          sortOrder: params.sortOrder,
        },
      });

  for (const [i, variant] of params.variants.entries()) {
    const existingVariant = await prisma.dishVariant.findFirst({
      where: { dishId: dish.id, label: variant.label },
    });
    if (existingVariant) {
      await prisma.dishVariant.update({
        where: { id: existingVariant.id },
        data: { priceMinor: rub(variant.priceRubles), weightGrams: variant.weightGrams, sortOrder: i },
      });
    } else {
      await prisma.dishVariant.create({
        data: {
          dishId: dish.id,
          label: variant.label,
          priceMinor: rub(variant.priceRubles),
          weightGrams: variant.weightGrams,
          sortOrder: i,
        },
      });
    }
  }

  return dish;
}

async function main() {
  const pizzas = await seedCategory("Пиццы", "pizzas", 0);
  const salads = await seedCategory("Салаты", "salads", 1);
  const sets = await seedCategory("Наборы", "sets", 2);
  await seedCategory("Напитки", "drinks", 3);

  await seedDish({
    categoryId: pizzas.id,
    name: "Пепперони",
    description: "Острая пепперони, моцарелла и томатный соус на тонком тесте.",
    sortOrder: 0,
    variants: [{ label: "24 см", priceRubles: 469, weightGrams: 450 }],
  });

  await seedDish({
    categoryId: pizzas.id,
    name: "Лесные грибы",
    description: "Лесные грибы, моцарелла, сливочный соус, зелень.",
    sortOrder: 1,
    variants: [{ label: "36 см", priceRubles: 995, weightGrams: 780 }],
  });

  await seedDish({
    categoryId: pizzas.id,
    name: "Четыре мяса",
    description: "Пепперони, ветчина, бекон, куриное филе, моцарелла.",
    sortOrder: 2,
    variants: [{ label: "33 см", priceRubles: 889, weightGrams: 700 }],
  });

  await seedDish({
    categoryId: pizzas.id,
    name: "Адана",
    description: "Фирменная пицца по мотивам турецкой кухни — острая аданская колбаса, перец, лук, специи.",
    sortOrder: 3,
    variants: [{ label: "36 см", priceRubles: 1199, weightGrams: 800 }],
  });

  await seedDish({
    categoryId: salads.id,
    name: "Греческий салат",
    description: "Свежие овощи, сыр фета, маслины, оливковое масло.",
    sortOrder: 0,
    variants: [{ label: "230 г", priceRubles: 299, weightGrams: 230 }],
  });

  await seedDish({
    categoryId: salads.id,
    name: "Цезарь",
    description: "Куриное филе, салат ромэн, пармезан, соус цезарь, гренки.",
    sortOrder: 1,
    variants: [{ label: "230 г", priceRubles: 389, weightGrams: 230 }],
  });

  await seedDish({
    categoryId: sets.id,
    name: "Летний сет",
    description: "3 пиццы 33 см на выбор — отличный вариант для компании.",
    sortOrder: 0,
    variants: [{ label: "3 пиццы 33 см", priceRubles: 1699 }],
  });

  await seedDish({
    categoryId: sets.id,
    name: "Комба Супер Тройка",
    description: "Пепперони, Ветчина и грибы, Chicken BBQ — 33 см.",
    sortOrder: 1,
    variants: [{ label: "3 пиццы 33 см", priceRubles: 1999 }],
  });

  await seedDish({
    categoryId: sets.id,
    name: "Набор Супер пятёрка",
    description: "Море, Пепперони, Четыре мяса, Маргарита, Мексиканская острая — 33 см.",
    sortOrder: 2,
    variants: [{ label: "5 пицц 33 см", priceRubles: 3299 }],
  });

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
