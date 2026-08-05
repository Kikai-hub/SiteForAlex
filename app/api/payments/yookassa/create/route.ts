import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createYookassaPayment, getYookassaPayment, isYookassaConfigured } from "@/lib/payments/yookassa";

export async function POST(request: NextRequest) {
  if (!isYookassaConfigured()) {
    return NextResponse.json({ error: "Онлайн-оплата временно недоступна" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { accessToken: token } });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }
  if (order.paymentMethod !== "ONLINE") {
    return NextResponse.json({ error: "Для этого заказа выбран другой способ оплаты" }, { status: 400 });
  }
  if (order.paymentStatus === "SUCCEEDED") {
    return NextResponse.json({ error: "Заказ уже оплачен" }, { status: 409 });
  }

  const returnUrl = `${request.nextUrl.origin}/checkout/success/${order.accessToken}`;

  // If a payment attempt is already in flight, reuse its confirmation link
  // instead of creating a second payment for the same order (double-click,
  // page refresh, or a customer navigating back to checkout).
  if (order.yookassaPaymentId) {
    const existing = await getYookassaPayment(order.yookassaPaymentId).catch(() => null);
    if (existing && existing.status === "pending" && existing.confirmation?.confirmation_url) {
      return NextResponse.json({ confirmationUrl: existing.confirmation.confirmation_url });
    }
  }

  const payment = await createYookassaPayment({
    amountMinor: order.totalMinor,
    description: `Заказ №${order.id} — Adana Pizza`,
    returnUrl,
    metadata: { orderId: String(order.id) },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { yookassaPaymentId: payment.id, paymentStatus: "PENDING" },
  });

  const confirmationUrl = payment.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    return NextResponse.json({ error: "Не удалось получить ссылку на оплату" }, { status: 502 });
  }

  return NextResponse.json({ confirmationUrl });
}
