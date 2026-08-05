import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";

export default async function AdminDashboardPage() {
  const [dishCount, activePromoCount, newOrders, recentOrders] = await Promise.all([
    prisma.dish.count(),
    prisma.promoCode.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
  ]);

  const stats = [
    { label: "Новые заказы", value: newOrders },
    { label: "Блюд в меню", value: dishCount },
    { label: "Активных промокодов", value: activePromoCount },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Обзор</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-flatbread-2 p-5">
            <p className="text-sm text-char/60">{s.label}</p>
            <p className="mt-1 font-sans text-3xl font-bold text-char">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-char">Последние заказы</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-ember hover:underline">
            Все заказы →
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl bg-flatbread-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-char/10 text-left text-char/50">
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-char/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-ember hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {order.guestName} · {formatPhoneForDisplay(order.guestPhone)}
                  </td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">{formatMinor(order.totalMinor)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-char/50">
                    Заказов пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
