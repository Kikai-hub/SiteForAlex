"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/auth/password";
import { courierCreateSchema } from "@/lib/validation/courier";

export type ActionState = { error?: string };

export async function createCourier(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = courierCreateSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const existing = await prisma.courier.findUnique({ where: { username: parsed.data.username } });
  if (existing) return { error: "Курьер с таким логином уже существует" };

  await prisma.courier.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  revalidatePath("/admin/couriers");
  redirect("/admin/couriers");
}

export async function deleteCourier(id: string): Promise<ActionState> {
  await requireAdmin();

  const activeDeliveries = await prisma.order.count({
    where: { courierId: id, status: "OUT_FOR_DELIVERY" },
  });
  if (activeDeliveries > 0) {
    return { error: "У курьера есть заказы в пути — сначала передайте их другому курьеру" };
  }

  await prisma.courier.delete({ where: { id } });
  revalidatePath("/admin/couriers");
  redirect("/admin/couriers");
}
