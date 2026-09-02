import { notFound } from "next/navigation";
import Link from "next/link";
import { DishGallery } from "@/components/site/DishGallery";
import { DishPurchasePanel } from "@/components/site/DishPurchasePanel";
import { DishRecommendations } from "@/components/site/DishRecommendations";
import { DishReviews } from "@/components/site/DishReviews";
import { getDishDetail, getRecommendedDishCardsCached } from "@/lib/cache/menu";

export default async function DishDetailPage({
  params,
}: {
  params: Promise<{ dishId: string }>;
}) {
  const { dishId } = await params;
  const dish = await getDishDetail(dishId);

  if (!dish) notFound();

  const recommendedDishes = await getRecommendedDishCardsCached(dish.id);

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
              nutrition={{
                caloriesPer100g: dish.caloriesPer100g,
                proteinPer100g: dish.proteinPer100g,
                fatPer100g: dish.fatPer100g,
                carbsPer100g: dish.carbsPer100g,
              }}
              variants={dish.variants.map((v) => ({
                id: v.id,
                label: v.label,
                priceMinor: v.priceMinor,
                weightGrams: v.weightGrams,
              }))}
              extras={dish.extras.map((e) => ({
                id: e.id,
                name: e.name,
                priceMinor: e.priceMinor,
                maxQuantity: e.maxQuantity,
                featured: e.featured,
              }))}
            />
          </div>
        </div>
      </div>

      <DishRecommendations dishes={recommendedDishes} />

      <DishReviews dishId={dish.id} />
    </div>
  );
}
