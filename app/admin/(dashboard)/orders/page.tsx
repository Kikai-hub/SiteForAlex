import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_TONE, type OrderStatus } from "@/lib/orderStatus";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Заказы</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            !filter ? "bg-char text-flatbread" : "bg-flatbread-2 text-char/60"
          }`}
        >
          Все
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === s ? "bg-char text-flatbread" : "bg-flatbread-2 text-char/60"
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">№</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Создан</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-char/5 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-ember hover:underline">
                    #{order.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {order.guestName} · {formatPhoneForDisplay(order.guestPhone)}
                </td>
                <td className="px-4 py-3 text-char/60">
                  {order.fulfillmentType === "DELIVERY" ? "Доставка" : "Самовывоз"}
                </td>
                <td className="px-4 py-3">{formatMinor(order.totalMinor)}</td>
                <td className="px-4 py-3">
                  <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-char/50">
                  {new Date(order.createdAt).toLocaleString("ru-RU")}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-char/50">
                  Заказов не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
