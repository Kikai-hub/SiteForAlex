import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export default async function AdminHeroSlidesPage() {
  const slides = await prisma.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
    include: { dish: { select: { name: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-char">Слайдер на главной</h1>
          <p className="mt-1 text-sm text-char/60">
            Баннеры и сеты в карусели на главной странице. Меняются автоматически каждые 10 секунд.
          </p>
        </div>
        <Link href="/admin/slides/new">
          <Button>Новый слайд</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">Баннер</th>
              <th className="px-4 py-3 font-medium">Заголовок</th>
              <th className="px-4 py-3 font-medium">Блюдо/сет</th>
              <th className="px-4 py-3 font-medium">Порядок</th>
              <th className="px-4 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((s) => (
              <tr key={s.id} className="border-b border-char/5 last:border-0">
                <td className="px-4 py-3">
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-white" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-char/10" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/slides/${s.id}`} className="font-semibold text-ember hover:underline">
                    {s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-char/60">{s.dish?.name ?? "—"}</td>
                <td className="px-4 py-3 text-char/60">{s.sortOrder}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                      s.isActive ? "bg-herb/15 text-herb" : "bg-char/10 text-char/50"
                    }`}
                  >
                    {s.isActive ? "Активен" : "Выключен"}
                  </span>
                </td>
              </tr>
            ))}
            {slides.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-char/50">
                  Слайдов пока нет — на главной показывается стандартный баннер.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
