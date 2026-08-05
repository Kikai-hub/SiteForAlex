import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { DeleteCourierButton } from "@/components/admin/DeleteCourierButton";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function AdminCouriersPage() {
  const thirtyDaysAgo = daysAgo(30);

  const [couriers, deliveredCounts] = await Promise.all([
    prisma.courier.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({
      by: ["courierId"],
      where: { status: "DELIVERED", deliveredAt: { gte: thirtyDaysAgo }, courierId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const countByCourierId = new Map(deliveredCounts.map((c) => [c.courierId, c._count._all]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-char">Курьеры</h1>
        <Link href="/admin/couriers/new">
          <Button>Новый курьер</Button>
        </Link>
      </div>

      <p className="mt-2 text-sm text-char/50">
        Ссылка для входа курьера: <span className="font-mono text-char/70">/courier/login</span> — сообщите
        курьеру логин и пароль, которые вы указали при создании профиля.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Логин</th>
              <th className="px-4 py-3 font-medium">Доставлено за 30 дней</th>
              <th className="px-4 py-3 font-medium">Добавлен</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {couriers.map((courier) => (
              <tr key={courier.id} className="border-b border-char/5 last:border-0">
                <td className="px-4 py-3 font-semibold text-char">{courier.name}</td>
                <td className="px-4 py-3 font-mono text-char/70">{courier.username}</td>
                <td className="px-4 py-3 text-char/70">{countByCourierId.get(courier.id) ?? 0}</td>
                <td className="px-4 py-3 text-char/50">
                  {new Date(courier.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteCourierButton id={courier.id} name={courier.name} />
                </td>
              </tr>
            ))}
            {couriers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-char/50">
                  Курьеров пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
