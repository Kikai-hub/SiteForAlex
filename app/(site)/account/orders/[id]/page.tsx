import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/customer";
import { formatMinor } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/lib/orderStatus";
import { ReorderButton } from "@/components/site/ReorderButton";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await requireCustomer();
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  // Ownership check — a customer must never be able to view another
  // customer's order by guessing/incrementing the numeric id.
  if (!order || order.customerId !== customer.id) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-char">Заказ №{order.id}</h2>
        <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>
      <p className="mt-1 text-sm text-char/50">{new Date(order.createdAt).toLocaleString("ru-RU")}</p>

      <div className="mt-5 overflow-hidden rounded-2xl bg-flatbread-2">
        <ul className="divide-y divide-char/5">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between px-4 py-3 text-sm">
              <span>
                {item.nameSnapshot} ({item.variantLabelSnapshot}) × {item.quantity}
              </span>
              <span className="font-medium">{formatMinor(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-char/10 p-4 text-sm">
          <div className="flex justify-between text-char/70">
            <span>Сумма</span>
            <span>{formatMinor(order.subtotalMinor)}</span>
          </div>
          {order.discountMinor > 0 && (
            <div className="flex justify-between text-herb">
              <span>Скидка</span>
              <span>−{formatMinor(order.discountMinor)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-char">
            <span>Итого</span>
            <span>{formatMinor(order.totalMinor)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <ReorderButton orderId={order.id} />
      </div>
    </div>
  );
}
