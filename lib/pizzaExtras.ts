/** Standard set of paid add-ons every pizza gets by default (crust + toppings).
 *  Applied to existing pizzas via prisma/seed-pizza-extras.ts and to new ones
 *  on creation in app/admin/(dashboard)/dishes/actions.ts — kept admin-editable
 *  afterwards through the normal DishExtra CRUD (ExtraEditor). */
export const PIZZA_CATEGORY_SLUG = "pizzas";

export const DEFAULT_PIZZA_EXTRAS: {
  name: string;
  priceRubles: number;
  maxQuantity: number;
  featured?: boolean;
}[] = [
  { name: "Сырный борт", priceRubles: 149, maxQuantity: 1, featured: true },
  { name: "Лук Красный", priceRubles: 69, maxQuantity: 5 },
  { name: "Перец Сладкий", priceRubles: 69, maxQuantity: 5 },
  { name: "Маслины", priceRubles: 69, maxQuantity: 5 },
  { name: "Перец халапеньо", priceRubles: 69, maxQuantity: 5 },
  { name: "Огурцы Маринованные", priceRubles: 69, maxQuantity: 5 },
  { name: "Грибы", priceRubles: 69, maxQuantity: 5 },
  { name: "Томаты свежие", priceRubles: 69, maxQuantity: 5 },
  { name: "Ананас", priceRubles: 69, maxQuantity: 5 },
  { name: "Сыр Моцарелла", priceRubles: 99, maxQuantity: 5 },
  { name: "Сыр Чеддер", priceRubles: 99, maxQuantity: 5 },
  { name: "Сыр с голубой плесенью", priceRubles: 99, maxQuantity: 5 },
  { name: "Пепперони", priceRubles: 99, maxQuantity: 5 },
  { name: "Ветчина свиная", priceRubles: 99, maxQuantity: 5 },
  { name: "Говядина", priceRubles: 99, maxQuantity: 5 },
  { name: "Бекон", priceRubles: 99, maxQuantity: 5 },
  { name: "Куриное филе", priceRubles: 99, maxQuantity: 5 },
];
