import { DishCard, type DishCardData } from "@/components/site/DishCard";

export function DishRecommendations({ dishes }: { dishes: DishCardData[] }) {
  if (dishes.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold text-char">Часто заказывают вместе</h2>
      <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
        {dishes.map((dish) => (
          <div key={dish.id} className="w-56 shrink-0 sm:w-64">
            <DishCard dish={dish} />
          </div>
        ))}
      </div>
    </section>
  );
}
