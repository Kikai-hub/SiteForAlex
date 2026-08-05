"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/customer";
import { addressSchema } from "@/lib/validation/address";

export type ActionState = { error?: string; ok?: boolean };
const OK: ActionState = { ok: true };

export async function createAddress(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const customer = await requireCustomer();
  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    city: formData.get("city") || "Москва",
    street: formData.get("street"),
    house: formData.get("house"),
    apartment: formData.get("apartment"),
    entrance: formData.get("entrance"),
    floor: formData.get("floor"),
    comment: formData.get("comment"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({
      where: { customerId: customer.id },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: {
      customerId: customer.id,
      label: parsed.data.label || null,
      city: parsed.data.city,
      street: parsed.data.street,
      house: parsed.data.house,
      apartment: parsed.data.apartment || null,
      entrance: parsed.data.entrance || null,
      floor: parsed.data.floor || null,
      comment: parsed.data.comment || null,
      isDefault: parsed.data.isDefault,
    },
  });
  revalidatePath("/account/addresses");
  return OK;
}

export async function deleteAddress(id: string) {
  const customer = await requireCustomer();
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.customerId !== customer.id) return;
  await prisma.address.delete({ where: { id } });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(id: string) {
  const customer = await requireCustomer();
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.customerId !== customer.id) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}
