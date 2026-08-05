import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";

export default async function AdminPromoCodesPage() {
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-char">Промокоды</h1>
        <Link href="/admin/promo-codes/new">
          <Button>Новый промокод</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">Код</th>
              <th className="px-4 py-3 font-medium">Скидка</th>
              <th className="px-4 py-3 font-medium">Использован</th>
              <th className="px-4 py-3 font-medium">Действует до</th>
              <th className="px-4 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((p) => (
              <tr key={p.id} className="border-b border-char/5 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/promo-codes/${p.id}`} className="font-mono font-semibold text-ember hover:underline">
                    {p.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-char/70">
                  {p.type === "PERCENT" ? `${p.value}%` : formatMinor(p.value)}
                </td>
                <td className="px-4 py-3 text-char/60">
                  {p.usedCount}
                  {p.maxUsesTotal != null ? ` / ${p.maxUsesTotal}` : ""}
                </td>
                <td className="px-4 py-3 text-char/60">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("ru-RU") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                      p.isActive ? "bg-herb/15 text-herb" : "bg-char/10 text-char/50"
                    }`}
                  >
                    {p.isActive ? "Активен" : "Выключен"}
                  </span>
                </td>
              </tr>
            ))}
            {promoCodes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-char/50">
                  Промокодов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
