"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { heroSlideSchema } from "@/lib/validation/heroSlide";
import { deleteHeroSlideImageFile } from "@/lib/uploads";

export type ActionState = { error?: string; ok?: boolean };
const OK: ActionState = { ok: true };

function revalidateHeroSlides() {
  revalidatePath("/admin/slides");
  revalidatePath("/");
  updateTag("hero-slides");
}

function parseForm(formData: FormData) {
  return heroSlideSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    badgeText: formData.get("badgeText"),
    priceLabel: formData.get("priceLabel"),
    ctaLabel: formData.get("ctaLabel") || "Подробнее",
    ctaHref: formData.get("ctaHref"),
    dishId: formData.get("dishId"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
}

function toDbData(data: ReturnType<typeof heroSlideSchema.parse>) {
  return {
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description || null,
    badgeText: data.badgeText || null,
    priceLabel: data.priceLabel || null,
    ctaLabel: data.ctaLabel,
    ctaHref: data.ctaHref || null,
    dishId: data.dishId || null,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  };
}

export async function createHeroSlide(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const slide = await prisma.heroSlide.create({ data: toDbData(parsed.data) });
  revalidateHeroSlides();
  redirect(`/admin/slides/${slide.id}`);
}

export async function updateHeroSlide(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.heroSlide.update({ where: { id }, data: toDbData(parsed.data) });
  revalidateHeroSlides();
  revalidatePath(`/admin/slides/${id}`);
  return OK;
}

export async function deleteHeroSlide(id: string) {
  await requireAdmin();
  const slide = await prisma.heroSlide.delete({ where: { id } });
  await deleteHeroSlideImageFile(slide.imageUrl);
  revalidateHeroSlides();
  redirect("/admin/slides");
}

export async function removeHeroSlideImage(id: string) {
  await requireAdmin();
  const existing = await prisma.heroSlide.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.heroSlide.update({ where: { id }, data: { imageUrl: null } });
  await deleteHeroSlideImageFile(existing?.imageUrl ?? null);
  revalidateHeroSlides();
  revalidatePath(`/admin/slides/${id}`);
}
