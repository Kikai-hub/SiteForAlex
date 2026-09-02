"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { dishSchema, dishVariantSchema, dishExtraSchema } from "@/lib/validation/dish";
import { toMinor } from "@/lib/money";
import { deleteDishMediaFile } from "@/lib/uploads";
import { DEFAULT_PIZZA_EXTRAS, PIZZA_CATEGORY_SLUG } from "@/lib/pizzaExtras";

export type ActionState = { error?: string; ok?: boolean };
const OK: ActionState = { ok: true };

function revalidateMenu() {
  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
  updateTag("menu");
}

export async function createDish(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = dishSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    caloriesPer100g: formData.get("caloriesPer100g") || undefined,
    proteinPer100g: formData.get("proteinPer100g") || undefined,
    fatPer100g: formData.get("fatPer100g") || undefined,
    carbsPer100g: formData.get("carbsPer100g") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });

  const dish = await prisma.dish.create({
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      caloriesPer100g: parsed.data.caloriesPer100g ?? null,
      proteinPer100g: parsed.data.proteinPer100g ?? null,
      fatPer100g: parsed.data.fatPer100g ?? null,
      carbsPer100g: parsed.data.carbsPer100g ?? null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  if (category?.slug === PIZZA_CATEGORY_SLUG) {
    await prisma.dishExtra.createMany({
      data: DEFAULT_PIZZA_EXTRAS.map((extra, i) => ({
        dishId: dish.id,
        name: extra.name,
        priceMinor: toMinor(extra.priceRubles),
        maxQuantity: extra.maxQuantity,
        sortOrder: i,
        featured: extra.featured ?? false,
      })),
    });
  }

  revalidateMenu();
  redirect(`/admin/dishes/${dish.id}`);
}

export async function updateDish(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = dishSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    caloriesPer100g: formData.get("caloriesPer100g") || undefined,
    proteinPer100g: formData.get("proteinPer100g") || undefined,
    fatPer100g: formData.get("fatPer100g") || undefined,
    carbsPer100g: formData.get("carbsPer100g") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.dish.update({
    where: { id },
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      caloriesPer100g: parsed.data.caloriesPer100g ?? null,
      proteinPer100g: parsed.data.proteinPer100g ?? null,
      fatPer100g: parsed.data.fatPer100g ?? null,
      carbsPer100g: parsed.data.carbsPer100g ?? null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    },
  });
  revalidateMenu();
  revalidatePath(`/admin/dishes/${id}`);
  return OK;
}

export async function deleteDish(id: string) {
  await requireAdmin();
  const media = await prisma.mediaAsset.findMany({ where: { dishId: id } });
  await prisma.dish.delete({ where: { id } });
  await Promise.all(media.map((m) => deleteDishMediaFile(m.url)));
  revalidateMenu();
  redirect("/admin/dishes");
}

export async function createVariant(
  dishId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = dishVariantSchema.safeParse({
    label: formData.get("label"),
    priceRubles: formData.get("priceRubles"),
    weightGrams: formData.get("weightGrams") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.dishVariant.create({
    data: {
      dishId,
      label: parsed.data.label,
      priceMinor: toMinor(parsed.data.priceRubles),
      weightGrams: parsed.data.weightGrams ?? null,
      sortOrder: parsed.data.sortOrder,
    },
  });
  revalidateMenu();
  revalidatePath(`/admin/dishes/${dishId}`);
  return OK;
}

export async function updateVariant(
  variantId: string,
  dishId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = dishVariantSchema.safeParse({
    label: formData.get("label"),
    priceRubles: formData.get("priceRubles"),
    weightGrams: formData.get("weightGrams") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.dishVariant.update({
    where: { id: variantId },
    data: {
      label: parsed.data.label,
      priceMinor: toMinor(parsed.data.priceRubles),
      weightGrams: parsed.data.weightGrams ?? null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    },
  });
  revalidateMenu();
  revalidatePath(`/admin/dishes/${dishId}`);
  return OK;
}

export async function deleteVariant(variantId: string, dishId: string) {
  await requireAdmin();
  await prisma.dishVariant.delete({ where: { id: variantId } });
  revalidateMenu();
  revalidatePath(`/admin/dishes/${dishId}`);
}

export async function deleteMedia(mediaId: string, dishId: string) {
  await requireAdmin();
  const media = await prisma.mediaAsset.delete({ where: { id: mediaId } });
  await deleteDishMediaFile(media.url);
  revalidateMenu();
  revalidatePath(`/admin/dishes/${dishId}`);
}

export async function setPrimaryMedia(mediaId: string, dishId: string) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.mediaAsset.updateMany({ where: { dishId }, data: { isPrimary: false } }),
    prisma.mediaAsset.update({ where: { id: mediaId }, data: { isPrimary: true } }),
  ]);
  revalidateMenu();
  revalidatePath(`/admin/dishes/${dishId}`);
}

export async function createExtra(
  dishId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = dishExtraSchema.safeParse({
    name: formData.get("name"),
    priceRubles: formData.get("priceRubles"),
    maxQuantity: formData.get("maxQuantity") || 5,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: true,
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.dishExtra.create({
    data: {
      dishId,
      name: parsed.data.name,
      priceMinor: toMinor(parsed.data.priceRubles),
      maxQuantity: parsed.data.maxQuantity,
      sortOrder: parsed.data.sortOrder,
      featured: parsed.data.featured,
    },
  });
  revalidatePath(`/admin/dishes/${dishId}`);
  revalidatePath(`/dish/${dishId}`);
  updateTag("menu");
  return OK;
}

export async function updateExtra(
  extraId: string,
  dishId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = dishExtraSchema.safeParse({
    name: formData.get("name"),
    priceRubles: formData.get("priceRubles"),
    maxQuantity: formData.get("maxQuantity") || 5,
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.dishExtra.update({
    where: { id: extraId },
    data: {
      name: parsed.data.name,
      priceMinor: toMinor(parsed.data.priceRubles),
      maxQuantity: parsed.data.maxQuantity,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      featured: parsed.data.featured,
    },
  });
  revalidatePath(`/admin/dishes/${dishId}`);
  revalidatePath(`/dish/${dishId}`);
  updateTag("menu");
  return OK;
}

export async function deleteExtra(extraId: string, dishId: string) {
  await requireAdmin();
  await prisma.dishExtra.delete({ where: { id: extraId } });
  revalidatePath(`/admin/dishes/${dishId}`);
  revalidatePath(`/dish/${dishId}`);
  updateTag("menu");
}
