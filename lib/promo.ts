import { prisma } from "@/lib/prisma";

export interface PromoValidationResult {
  ok: true;
  promoCodeId: string;
  code: string;
  discountMinor: number;
  maxUsesTotal: number | null;
}

export interface PromoValidationError {
  ok: false;
  message: string;
}

/**
 * Re-validates a promo code server-side against live DB state. Must be called
 * both for the checkout preview AND again at order-creation time — never trust
 * a discount amount computed on the client.
 */
export async function validatePromoCode(params: {
  code: string;
  subtotalMinor: number;
  customerId?: string | null;
  guestPhone?: string | null;
}): Promise<PromoValidationResult | PromoValidationError> {
  const { subtotalMinor, customerId, guestPhone } = params;
  const code = params.code.trim().toUpperCase();
  if (!code) return { ok: false, message: "Введите промокод" };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo || !promo.isActive) {
    return { ok: false, message: "Промокод не найден или неактивен" };
  }

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) {
    return { ok: false, message: "Промокод ещё не активен" };
  }
  if (promo.expiresAt && now > promo.expiresAt) {
    return { ok: false, message: "Срок действия промокода истёк" };
  }
  if (promo.minOrderAmountMinor && subtotalMinor < promo.minOrderAmountMinor) {
    return {
      ok: false,
      message: `Минимальная сумма заказа для этого промокода: ${(
        promo.minOrderAmountMinor / 100
      ).toLocaleString("ru-RU")} ₽`,
    };
  }
  if (promo.maxUsesTotal != null && promo.usedCount >= promo.maxUsesTotal) {
    return { ok: false, message: "Промокод больше не действует — лимит использований исчерпан" };
  }

  if (promo.maxUsesPerCustomer != null) {
    const usedByThisCustomer = await prisma.order.count({
      where: {
        promoCodeId: promo.id,
        status: { not: "CANCELLED" },
        ...(customerId ? { customerId } : guestPhone ? { guestPhone } : {}),
      },
    });
    if ((customerId || guestPhone) && usedByThisCustomer >= promo.maxUsesPerCustomer) {
      return { ok: false, message: "Вы уже использовали этот промокод" };
    }
  }

  const discountMinor =
    promo.type === "PERCENT"
      ? Math.round((subtotalMinor * promo.value) / 100)
      : Math.min(promo.value, subtotalMinor);

  return {
    ok: true,
    promoCodeId: promo.id,
    code: promo.code,
    discountMinor,
    maxUsesTotal: promo.maxUsesTotal,
  };
}
