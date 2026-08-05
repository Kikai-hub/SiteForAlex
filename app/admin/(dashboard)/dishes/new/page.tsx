import { prisma } from "@/lib/prisma";
import { DishCreateForm } from "@/components/admin/DishCreateForm";

export default async function NewDishPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Новое блюдо</h1>
      <p className="mt-1 text-sm text-char/60">
        После создания вы сможете добавить размеры/цены и фото/видео.
      </p>
      <div className="mt-6">
        <DishCreateForm categories={categories} />
      </div>
    </div>
  );
}
