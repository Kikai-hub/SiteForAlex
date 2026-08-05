import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";

export default async function AdminDishesPage() {
  const dishes = await prisma.dish.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { category: true, variants: { orderBy: { sortOrder: "asc" } }, media: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-char">Меню</h1>
        <Link href="/admin/dishes/new">
          <Button>Добавить блюдо</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">Блюдо</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3 font-medium">Варианты</th>
              <th className="px-4 py-3 font-medium">Медиа</th>
              <th className="px-4 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((dish) => (
              <tr key={dish.id} className="border-b border-char/5 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/dishes/${dish.id}`} className="font-semibold text-ember hover:underline">
                    {dish.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-char/60">{dish.category.name}</td>
                <td className="px-4 py-3 text-char/60">
                  {dish.variants.map((v) => `${v.label} — ${formatMinor(v.priceMinor)}`).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-char/60">{dish.media.length}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                      dish.isActive ? "bg-herb/15 text-herb" : "bg-char/10 text-char/50"
                    }`}
                  >
                    {dish.isActive ? "Активно" : "Скрыто"}
                  </span>
                </td>
              </tr>
            ))}
            {dishes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-char/50">
                  Блюд пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
