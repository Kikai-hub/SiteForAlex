import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/customer";
import { formatMinor } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/lib/orderStatus";

export default async function OrdersPage() {
  const customer = await requireCustomer();
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return <p className="text-char/50">Заказов пока нет — самое время это исправить.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block rounded-2xl bg-flatbread-2 p-5 hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-char">Заказ №{order.id}</p>
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-char/50">
            {new Date(order.createdAt).toLocaleString("ru-RU")} ·{" "}
            {order.items.map((i) => i.nameSnapshot).join(", ")}
          </p>
          <p className="mt-2 font-semibold text-char">{formatMinor(order.totalMinor)}</p>
        </Link>
      ))}
    </div>
  );
}
