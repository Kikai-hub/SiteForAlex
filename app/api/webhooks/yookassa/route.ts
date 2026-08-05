import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getYookassaPayment, isYookassaConfigured, type YookassaPaymentStatus } from "@/lib/payments/yookassa";

const STATUS_MAP: Record<YookassaPaymentStatus, "PENDING" | "WAITING_FOR_CAPTURE" | "SUCCEEDED" | "CANCELED"> = {
  pending: "PENDING",
  waiting_for_capture: "WAITING_FOR_CAPTURE",
  succeeded: "SUCCEEDED",
  canceled: "CANCELED",
};

export async function POST(request: NextRequest) {
  if (!isYookassaConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const notifiedId = body?.object?.id;
  if (typeof notifiedId !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Never trust body.object.status — YooKassa notifications are unsigned, so
  // anyone who finds this URL could POST a fake "succeeded" event. Re-fetch
  // the payment from YooKassa with our own credentials and act on that.
  const payment = await getYookassaPayment(notifiedId).catch(() => null);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({ where: { yookassaPaymentId: payment.id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const paymentStatus = STATUS_MAP[payment.status];
  const justSucceeded = paymentStatus === "SUCCEEDED" && order.paymentStatus !== "SUCCEEDED";

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus,
      paidAt: justSucceeded ? new Date() : order.paidAt,
      // Move a freshly-paid order out of NEW so kitchen/admin see it as
      // confirmed, same as staff manually confirming a CASH/CARD order —
      // but don't clobber a status that's already progressed further.
      status: justSucceeded && order.status === "NEW" ? "CONFIRMED" : order.status,
    },
  });

  return NextResponse.json({ ok: true });
}
