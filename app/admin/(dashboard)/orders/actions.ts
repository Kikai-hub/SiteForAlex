"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { awardBonusPointsForOrder, refundBonusRedemptionForOrder } from "@/lib/bonus";

const STATUSES = ["NEW", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;

export async function updateOrderStatus(orderId: number, status: string) {
  await requireAdmin();
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Invalid status");
  }

  // CANCELLED is terminal. Without this guard, bouncing an order
  // CANCELLED -> DELIVERED (a fat-fingered dropdown, or two admin tabs
  // racing) would re-trigger awardBonusPointsForOrder and double-credit the
  // customer, since refundBonusRedemptionForOrder already cleared
  // bonusEarnedAt back to null when it was cancelled. An order that
  // genuinely needs to go out again should be a new order, not a status
  // flip on this one. Setting CANCELLED itself is always allowed (including
  // re-selecting it on an already-cancelled order, a harmless no-op).
  const updated = await prisma.order.updateMany({
    where: status === "CANCELLED" ? { id: orderId } : { id: orderId, status: { not: "CANCELLED" } },
    data: { status: status as (typeof STATUSES)[number] },
  });
  if (updated.count === 0) {
    throw new Error("Заказ отменён — статус отменённого заказа изменить нельзя");
  }

  if (status === "DELIVERED") await awardBonusPointsForOrder(orderId);
  if (status === "CANCELLED") await refundBonusRedemptionForOrder(orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
