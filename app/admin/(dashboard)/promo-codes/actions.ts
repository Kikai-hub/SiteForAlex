"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { promoCodeSchema } from "@/lib/validation/promo";
import { toMinor } from "@/lib/money";

type PromoCodeInput = z.infer<typeof promoCodeSchema>;

export type ActionState = { error?: string; ok?: boolean };
const OK: ActionState = { ok: true };

function parseForm(formData: FormData) {
  return promoCodeSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderAmountRubles: formData.get("minOrderAmountRubles") || undefined,
    maxUsesTotal: formData.get("maxUsesTotal") || undefined,
    maxUsesPerCustomer: formData.get("maxUsesPerCustomer") || undefined,
    startsAt: formData.get("startsAt") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    isActive: formData.get("isActive") === "on",
  });
}

function toDbData(data: PromoCodeInput) {
  return {
    code: data.code,
    type: data.type,
    value: data.type === "FIXED" ? toMinor(data.value) : Math.round(data.value),
    minOrderAmountMinor:
      data.minOrderAmountRubles != null ? toMinor(data.minOrderAmountRubles) : null,
    maxUsesTotal: data.maxUsesTotal ?? null,
    maxUsesPerCustomer: data.maxUsesPerCustomer ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive,
  };
}

export async function createPromoCode(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const existing = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { error: "Промокод с таким кодом уже существует" };

  const promo = await prisma.promoCode.create({ data: toDbData(parsed.data) });
  revalidatePath("/admin/promo-codes");
  redirect(`/admin/promo-codes/${promo.id}`);
}

export async function updatePromoCode(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const existing = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (existing && existing.id !== id) return { error: "Промокод с таким кодом уже существует" };

  await prisma.promoCode.update({ where: { id }, data: toDbData(parsed.data) });
  revalidatePath("/admin/promo-codes");
  revalidatePath(`/admin/promo-codes/${id}`);
  return OK;
}

export async function deletePromoCode(id: string) {
  await requireAdmin();
  await prisma.promoCode.delete({ where: { id } });
  revalidatePath("/admin/promo-codes");
  redirect("/admin/promo-codes");
}
