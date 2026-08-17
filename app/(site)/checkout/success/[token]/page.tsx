import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Looked up by the unguessable accessToken, never by the sequential Order.id —
  // otherwise anyone could enumerate /checkout/success/1, /2, ... and read other
  // customers' phone numbers and order details.
  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: { items: { include: { extras: true } } },
  });
  if (!order) notFound();

  const awaitingOnlinePayment = order.paymentMethod === "ONLINE" && order.paymentStatus !== "SUCCEEDED";

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <Stamp tone="ember" className="mx-auto h-20 w-20 text-3xl">
        {awaitingOnlinePayment ? "…" : "✓"}
      </Stamp>
      <h1 className="mt-6 font-display text-3xl font-semibold text-char">
        {awaitingOnlinePayment ? `Заказ №${order.id} оформлен` : `Заказ №${order.id} принят`}
      </h1>
      <p className="mt-2 text-char/60">
        {awaitingOnlinePayment
          ? "Ждём подтверждения оплаты от ЮKassa — это обычно занимает несколько секунд. Обновите страницу, если статус не изменился."
          : `Мы свяжемся с вами по телефону ${order.guestPhone} для подтверждения.`}
      </p>

      <div className="mt-8 rounded-2xl bg-flatbread-2 p-6 text-left">
        <ul className="space-y-2 text-sm text-char/70">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.nameSnapshot} ({item.variantLabelSnapshot})
                {item.extras.length > 0 && (
                  <span className="text-char/40">
                    {" "}
                    · {item.extras.map((e) => `${e.nameSnapshot}${e.quantity > 1 ? ` ×${e.quantity}` : ""}`).join(", ")}
                  </span>
                )}{" "}
                × {item.quantity}
              </span>
              <span>{formatMinor(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-char/10 pt-3 text-lg font-bold text-char">
          <span className="font-display font-semibold">Итого</span>
          <span className="font-sans">{formatMinor(order.totalMinor)}</span>
        </div>
      </div>

      <Link href="/menu" className="mt-8 inline-block">
        <Button size="lg" variant="secondary">
          Вернуться в меню
        </Button>
      </Link>
    </div>
  );
}
