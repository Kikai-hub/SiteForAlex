import Link from "next/link";
import { Stamp } from "@/components/ui/Stamp";
import { PriceTag } from "@/components/ui/PriceTag";
import { AddToCartButton } from "@/components/site/AddToCartButton";
import { StarRating } from "@/components/ui/StarRating";

export interface DishCardData {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  variants: { id: string; label: string; priceMinor: number }[];
  rating?: { avg: number; count: number } | null;
}

export function DishCard({ dish }: { dish: DishCardData }) {
  const cheapest = dish.variants[0];
  const singleVariant = dish.variants.length === 1;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-flatbread-2 transition-shadow hover:shadow-lg">
      <Link href={`/dish/${dish.id}`} className="block">
        {dish.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dish.imageUrl} alt={dish.name} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-saffron/20 to-ember/10">
            <Stamp tone="flatbread" className="h-20 w-20 text-2xl font-display font-semibold">
              {dish.name.slice(0, 1)}
            </Stamp>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dish/${dish.id}`}>
            <h3 className="font-display text-lg font-semibold text-char">{dish.name}</h3>
          </Link>
          {dish.rating && dish.rating.count > 0 && (
            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <StarRating value={dish.rating.avg} size="sm" />
              <span className="text-xs text-char/50">{dish.rating.avg.toFixed(1)}</span>
            </div>
          )}
        </div>
        {dish.description && (
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-char/60">{dish.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          {cheapest && <PriceTag minor={cheapest.priceMinor} />}
          {singleVariant && cheapest ? (
            <AddToCartButton
              dishId={dish.id}
              dishVariantId={cheapest.id}
              name={dish.name}
              variantLabel={cheapest.label}
              priceMinor={cheapest.priceMinor}
              imageUrl={dish.imageUrl}
              size="sm"
            />
          ) : (
            <Link
              href={`/dish/${dish.id}`}
              className="text-sm font-semibold text-ember hover:underline"
            >
              Выбрать размер →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
