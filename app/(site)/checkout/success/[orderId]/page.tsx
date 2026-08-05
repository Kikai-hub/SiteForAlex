import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const id = Number(orderId);
  if (!Number.isInteger(id)) notFound();

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <Stamp tone="ember" className="mx-auto h-20 w-20 text-3xl">
        ✓
      </Stamp>
      <h1 className="mt-6 font-display text-3xl font-semibold text-char">Заказ №{order.id} принят</h1>
      <p className="mt-2 text-char/60">
        Мы свяжемся с вами по телефону {order.guestPhone} для подтверждения.
      </p>

      <div className="mt-8 rounded-2xl bg-flatbread-2 p-6 text-left">
        <ul className="space-y-2 text-sm text-char/70">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.nameSnapshot} ({item.variantLabelSnapshot}) × {item.quantity}
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
