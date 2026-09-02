import { getMenuCategories, getApprovedDishRatings } from "@/lib/cache/menu";
import { DishCard } from "@/components/site/DishCard";

export const metadata = { title: "Меню — Adana Pizza" };

export default async function MenuPage() {
  const [categories, ratingGroups] = await Promise.all([
    getMenuCategories(),
    getApprovedDishRatings(),
  ]);

  const nonEmptyCategories = categories.filter((c) => c.dishes.length > 0);

  const ratingByDishId = new Map(
    ratingGroups.map((g) => [g.dishId, { avg: g._avg.rating ?? 0, count: g._count }])
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-4xl font-semibold text-char">Меню</h1>
      <p className="mt-2 text-char/60">Собираем заказ — добавляйте блюда в корзину.</p>

      <div className="sticky top-[60px] z-30 -mx-5 mt-6 flex gap-2 overflow-x-auto bg-flatbread/95 px-5 py-3 backdrop-blur">
        {nonEmptyCategories.map((c) => (
          <a
            key={c.id}
            href={`#${c.slug}`}
            className="whitespace-nowrap rounded-full bg-flatbread-2 px-4 py-2 text-sm font-semibold text-char/70 hover:bg-char hover:text-flatbread"
          >
            {c.name}
          </a>
        ))}
      </div>

      {nonEmptyCategories.map((category) => (
        <section key={category.id} id={category.slug} className="scroll-mt-32 py-10">
          <h2 className="font-display text-2xl font-semibold text-char">{category.name}</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={{
                  id: dish.id,
                  name: dish.name,
                  description: dish.description,
                  imageUrl: dish.media[0]?.url ?? null,
                  variants: dish.variants.map((v) => ({
                    id: v.id,
                    label: v.label,
                    priceMinor: v.priceMinor,
                  })),
                  rating: ratingByDishId.get(dish.id) ?? null,
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {nonEmptyCategories.length === 0 && (
        <p className="py-16 text-center text-char/50">Меню пока наполняется — загляните чуть позже.</p>
      )}

      <div className="mt-6 rounded-2xl bg-flatbread-2 p-6 text-center">
        <p className="text-char/70">Не нашли то, что искали, или хотите что-то уточнить?</p>
        <a href="tel:+79932590143" className="mt-1 inline-block font-display text-xl font-semibold text-ember">
          +7 (993) 259-01-43
        </a>
      </div>
    </div>
  );
}
