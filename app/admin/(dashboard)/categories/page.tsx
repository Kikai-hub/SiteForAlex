import { prisma } from "@/lib/prisma";
import { CategoryCreateForm } from "@/components/admin/CategoryCreateForm";
import { CategoryRow } from "@/components/admin/CategoryRow";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { dishes: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Категории меню</h1>

      <div className="mt-6">
        <CategoryCreateForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-flatbread-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-char/10 text-left text-char/50">
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Порядок</th>
              <th className="px-4 py-3 font-medium">Блюд</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <CategoryRow
                key={c.id}
                id={c.id}
                name={c.name}
                slug={c.slug}
                sortOrder={c.sortOrder}
                isActive={c.isActive}
                dishCount={c._count.dishes}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
