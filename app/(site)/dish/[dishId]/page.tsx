import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DishGallery } from "@/components/site/DishGallery";
import { DishPurchasePanel } from "@/components/site/DishPurchasePanel";

export default async function DishDetailPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  const { dishId } = await params;
  const dish = await prisma.dish.findUnique({
    where: { id: dishId, isActive: true },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
    },
  });

  if (!dish) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <nav className="text-sm text-char/50">
        <Link href="/menu" className="hover:text-char">Меню</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/menu#${dish.category.slug}`} className="hover:text-char">
          {dish.category.name}
        </Link>
      </nav>

      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <DishGallery media={dish.media} dishName={dish.name} />

        <div>
          <h1 className="font-display text-3xl font-semibold text-char md:text-4xl">{dish.name}</h1>
          {dish.description && <p className="mt-3 text-char/70">{dish.description}</p>}

          <div className="mt-6">
            <DishPurchasePanel
              dishId={dish.id}
              dishName={dish.name}
              imageUrl={dish.media[0]?.url ?? null}
              caloriesPer100g={dish.caloriesPer100g}
              variants={dish.variants.map((v) => ({
                id: v.id,
                label: v.label,
                priceMinor: v.priceMinor,
                weightGrams: v.weightGrams,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
