"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCourier } from "@/lib/auth/courier";

export type ActionState = { error?: string; ok?: boolean };

/**
 * Conditional on courierId still being null at update time — otherwise two
 * couriers opening the same "new orders" list could both claim the same
 * delivery when they tap it within moments of each other.
 */
export async function claimOrder(orderId: number): Promise<ActionState> {
  const courier = await requireCourier();

  const claimed = await prisma.order.updateMany({
    where: {
      id: orderId,
      fulfillmentType: "DELIVERY",
      courierId: null,
      status: { notIn: ["CANCELLED", "DELIVERED"] },
    },
    data: { courierId: courier.id, assignedAt: new Date(), status: "OUT_FOR_DELIVERY" },
  });

  if (claimed.count === 0) {
    return { error: "Заказ уже забрал другой курьер" };
  }

  revalidatePath("/courier");
  return { ok: true };
}

/** Ownership check lives in the WHERE clause, not a separate read-then-write step. */
export async function markDelivered(orderId: number): Promise<ActionState> {
  const courier = await requireCourier();

  const updated = await prisma.order.updateMany({
    where: { id: orderId, courierId: courier.id, status: "OUT_FOR_DELIVERY" },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });

  if (updated.count === 0) {
    return { error: "Не удалось обновить заказ — возможно, он уже отмечен доставленным" };
  }

  revalidatePath("/courier");
  return { ok: true };
}
