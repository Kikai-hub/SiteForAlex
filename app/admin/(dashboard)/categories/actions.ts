"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { categorySchema } from "@/lib/validation/dish";

export type ActionState = { error?: string; ok?: boolean };

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "Категория с таким slug уже существует" };

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true };
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.category.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const dishCount = await prisma.dish.count({ where: { categoryId: id } });
  if (dishCount > 0) {
    return { error: "Нельзя удалить категорию, в которой есть блюда" };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/menu");
  return { ok: true };
}
