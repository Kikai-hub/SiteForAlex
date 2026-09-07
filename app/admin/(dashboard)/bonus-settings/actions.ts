"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { bonusSettingsSchema } from "@/lib/validation/bonus";

export type ActionState = { error?: string; ok?: boolean };

export async function updateBonusSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = bonusSettingsSchema.safeParse({
    earnPercent: formData.get("earnPercent"),
    maxRedeemPercent: formData.get("maxRedeemPercent"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await prisma.bonusSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });
  updateTag("bonus-settings");
  revalidatePath("/admin/bonus-settings");
  return { ok: true };
}
