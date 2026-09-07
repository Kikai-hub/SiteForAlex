import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

const SETTINGS_ID = "singleton";

/** 1 bonus point is worth exactly 1 ruble of discount. */
export const POINT_VALUE_MINOR = 100;

type TxClient = Prisma.TransactionClient;

const getCachedSettings = unstable_cache(
  async () => {
    const settings = await prisma.bonusSettings.findUnique({ where: { id: SETTINGS_ID } });
    return { earnPercent: settings?.earnPercent ?? 5, maxRedeemPercent: settings?.maxRedeemPercent ?? 50 };
  },
  ["bonus-settings"],
  { tags: ["bonus-settings"], revalidate: 60 }
);

/** Cached read of the admin-configured earn/redeem rates — falls back to the
 *  schema defaults if the settings row hasn't been created yet (it's created
 *  lazily the first time an admin saves the settings form). */
export async function getBonusSettings() {
  return getCachedSettings();
}

async function getOrCreateWallet(tx: TxClient, phone: string) {
  return tx.bonusWallet.upsert({ where: { phone }, create: { phone }, update: {} });
}

/** Uncached, live read of the settings row — used inside a transaction right
 *  before spending points, so a cap an admin just changed via the settings
 *  form (which can take up to 60s to show up through getBonusSettings'
 *  unstable_cache) is still enforced on the write path, not just the preview. */
async function getLiveBonusSettings(tx: TxClient) {
  const settings = await tx.bonusSettings.findUnique({ where: { id: SETTINGS_ID } });
  return { earnPercent: settings?.earnPercent ?? 5, maxRedeemPercent: settings?.maxRedeemPercent ?? 50 };
}

/** Current balance for a phone number, 0 if it has never earned any points. */
export async function getWalletBalance(phone: string): Promise<number> {
  const wallet = await prisma.bonusWallet.findUnique({ where: { phone }, select: { balance: true } });
  return wallet?.balance ?? 0;
}

export interface BonusRedemptionPreview {
  walletBalance: number;
  eligibleSubtotalMinor: number;
  maxRedeemablePoints: number;
  pointsRedeemed: number;
  discountMinor: number;
}

/**
 * Re-validates a requested points redemption against the live wallet balance,
 * the admin-configured max-redeem-% cap, and how much of the order is
 * actually eligible (see Dish.bonusRedeemable / lib/checkout.ts). Called both
 * for the checkout preview AND again at order-creation time — never trust a
 * discount amount computed on the client, mirroring lib/promo.ts.
 */
export async function previewBonusRedemption(params: {
  phone: string;
  subtotalMinor: number;
  /** Discount already applied by a promo code (0 if none) — the bonus cap is
   *  sized against what's actually still owed after that, not the gross
   *  subtotal. Without this, promo and bonus discounts are each capped
   *  independently against the same gross amount and can stack past the
   *  order's real value, spending points for zero benefit. */
  discountMinor?: number;
  eligibleSubtotalMinor: number;
  requestedPoints: number;
}): Promise<BonusRedemptionPreview> {
  const { phone, subtotalMinor, eligibleSubtotalMinor, requestedPoints } = params;
  const discountMinor = params.discountMinor ?? 0;
  const [wallet, settings] = await Promise.all([
    prisma.bonusWallet.findUnique({ where: { phone }, select: { balance: true } }),
    getBonusSettings(),
  ]);

  const walletBalance = wallet?.balance ?? 0;
  const remainingAfterPromoMinor = Math.max(subtotalMinor - discountMinor, 0);
  const capByOrderMinor = Math.floor((remainingAfterPromoMinor * settings.maxRedeemPercent) / 100);
  const maxDiscountMinor = Math.max(
    0,
    Math.min(eligibleSubtotalMinor, capByOrderMinor, remainingAfterPromoMinor, walletBalance * POINT_VALUE_MINOR)
  );
  const maxRedeemablePoints = Math.floor(maxDiscountMinor / POINT_VALUE_MINOR);
  const pointsRedeemed = Math.max(0, Math.min(Math.floor(requestedPoints), maxRedeemablePoints));

  return {
    walletBalance,
    eligibleSubtotalMinor,
    maxRedeemablePoints,
    pointsRedeemed,
    discountMinor: pointsRedeemed * POINT_VALUE_MINOR,
  };
}

export const BONUS_INSUFFICIENT = Symbol("BONUS_INSUFFICIENT");
export const BONUS_CAP_EXCEEDED = Symbol("BONUS_CAP_EXCEEDED");

/**
 * Atomically spends points from a phone's wallet as part of an order-creation
 * transaction.
 *
 * Two things are re-verified against live state here, not trusted from the
 * `points`/discount amounts previewBonusRedemption computed moments earlier
 * outside this transaction:
 * - The max-redeem-% cap (via a live, uncached settings read) — an admin
 *   could have lowered it in the gap between the preview and this call.
 *   Throws BONUS_CAP_EXCEEDED if `points` no longer fits under it.
 * - The wallet balance, via a conditional `updateMany` (not a separate
 *   read-then-write) so two concurrent orders can't both spend the same
 *   points — mirroring the promo-code usedCount guard in
 *   app/api/orders/route.ts. Throws BONUS_INSUFFICIENT if the balance
 *   dropped below `points` in the meantime.
 */
export async function redeemBonusPoints(
  tx: TxClient,
  params: {
    phone: string;
    points: number;
    subtotalMinor: number;
    discountMinor: number;
    eligibleSubtotalMinor: number;
    orderId: number;
  }
) {
  const { phone, points, subtotalMinor, discountMinor, eligibleSubtotalMinor, orderId } = params;
  if (points <= 0) return;

  const settings = await getLiveBonusSettings(tx);
  const remainingAfterPromoMinor = Math.max(subtotalMinor - discountMinor, 0);
  const capByOrderMinor = Math.floor((remainingAfterPromoMinor * settings.maxRedeemPercent) / 100);
  const maxAllowedMinor = Math.max(0, Math.min(eligibleSubtotalMinor, capByOrderMinor, remainingAfterPromoMinor));
  if (points * POINT_VALUE_MINOR > maxAllowedMinor) throw BONUS_CAP_EXCEEDED;

  const wallet = await getOrCreateWallet(tx, phone);
  const updated = await tx.bonusWallet.updateMany({
    where: { id: wallet.id, balance: { gte: points } },
    data: { balance: { decrement: points } },
  });
  if (updated.count === 0) throw BONUS_INSUFFICIENT;

  await tx.bonusTransaction.create({
    data: {
      walletId: wallet.id,
      type: "REDEEM",
      amount: -points,
      orderId,
      note: `Списание за заказ №${orderId}`,
    },
  });
}

/**
 * Idempotently credits the points an order earned once it reaches DELIVERED —
 * safe to call from both the admin ("updateOrderStatus") and courier
 * ("markDelivered") actions. Guarded by an atomic conditional `updateMany`
 * (not a plain `update` after a separate read) so two concurrent calls for
 * the same order — e.g. an admin and a courier both marking it delivered at
 * nearly the same moment — can't both pass the "not yet credited" check and
 * double-credit the wallet; only one's `updateMany` matches and wins.
 */
export async function awardBonusPointsForOrder(orderId: number) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        totalMinor: true,
        bonusEarnedAt: true,
        guestPhone: true,
        customer: { select: { phone: true } },
      },
    });
    if (!order || order.status !== "DELIVERED" || order.bonusEarnedAt) return;

    const settings = await getBonusSettings();
    const points = Math.floor((order.totalMinor * settings.earnPercent) / (100 * POINT_VALUE_MINOR));
    const phone = order.customer?.phone ?? order.guestPhone;

    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: "DELIVERED", bonusEarnedAt: null },
      data: { bonusPointsEarned: points, bonusEarnedAt: new Date() },
    });
    if (claimed.count === 0) return; // another concurrent call already credited this order
    if (points <= 0) return;

    const wallet = await getOrCreateWallet(tx, phone);
    await tx.bonusWallet.update({ where: { id: wallet.id }, data: { balance: { increment: points } } });
    await tx.bonusTransaction.create({
      data: {
        walletId: wallet.id,
        type: "EARN",
        amount: points,
        orderId: order.id,
        note: `Начисление за заказ №${order.id}`,
      },
    });
  });
}

/**
 * Idempotently reverses an order's bonus effects once it's CANCELLED:
 * - REDEEM: any points spent on it are returned to the wallet.
 * - EARN: if it had already reached DELIVERED (and so already earned
 *   points — see awardBonusPointsForOrder) before being cancelled, those
 *   points are clawed back too, since the order they were earned for no
 *   longer stands. Recorded as an ADJUSTMENT (negative), since REFUND is
 *   specifically the REDEEM-reversal type.
 * - Order.totalMinor is recomputed without the (now-reversed) bonus
 *   discount, so the stored total still equals subtotal − promo discount.
 *
 * Guarded by an atomic conditional `updateMany` keyed on the exact values
 * just read (not a plain `update` after a separate read), so two concurrent
 * cancellations of the same order — two admin tabs, a retried request —
 * can't both pass the guard and double-refund/double-claw-back; only one's
 * `updateMany` matches and wins, mirroring redeemBonusPoints/
 * awardBonusPointsForOrder's guards.
 */
export async function refundBonusRedemptionForOrder(orderId: number) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        subtotalMinor: true,
        discountMinor: true,
        bonusPointsRedeemed: true,
        bonusPointsEarned: true,
        bonusEarnedAt: true,
        guestPhone: true,
        customer: { select: { phone: true } },
      },
    });
    if (!order || order.status !== "CANCELLED") return;

    const redeemPoints = order.bonusPointsRedeemed;
    const earnedPoints = order.bonusEarnedAt ? order.bonusPointsEarned : 0;
    if (redeemPoints <= 0 && earnedPoints <= 0) return;

    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        status: "CANCELLED",
        bonusPointsRedeemed: order.bonusPointsRedeemed,
        bonusPointsEarned: order.bonusPointsEarned,
        bonusEarnedAt: order.bonusEarnedAt,
      },
      data: {
        bonusPointsRedeemed: 0,
        bonusDiscountMinor: 0,
        ...(earnedPoints > 0 ? { bonusPointsEarned: 0, bonusEarnedAt: null } : {}),
        totalMinor: Math.max(order.subtotalMinor - order.discountMinor, 0),
      },
    });
    if (claimed.count === 0) return; // another concurrent call already reversed this order

    const phone = order.customer?.phone ?? order.guestPhone;
    const wallet = await getOrCreateWallet(tx, phone);
    const netPoints = redeemPoints - earnedPoints;
    if (netPoints !== 0) {
      // Plain `increment` here (like everywhere else in this file) would be
      // safe against concurrent mutations but could still drive the balance
      // negative — the EARN clawback (netPoints < 0) has no floor the way
      // redeemBonusPoints' `gte` guard gives the REDEEM side, since the
      // customer may have already spent those earned points on another
      // order by the time this one gets cancelled. GREATEST(...) clamps the
      // result at 0 atomically, in the same statement as the increment.
      await tx.$executeRaw`UPDATE "BonusWallet" SET balance = GREATEST(balance + ${netPoints}, 0), "updatedAt" = NOW() WHERE id = ${wallet.id}`;
    }
    if (redeemPoints > 0) {
      await tx.bonusTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: redeemPoints,
          orderId: order.id,
          note: `Возврат баллов за отменённый заказ №${order.id}`,
        },
      });
    }
    if (earnedPoints > 0) {
      await tx.bonusTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADJUSTMENT",
          amount: -earnedPoints,
          orderId: order.id,
          note: `Списание начисленных баллов — заказ №${order.id} отменён после доставки`,
        },
      });
    }
  });
}
