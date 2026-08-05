"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { formatMinor } from "@/lib/money";
import { Button } from "@/components/ui/Button";

interface Variant {
  id: string;
  label: string;
  priceMinor: number;
  weightGrams: number | null;
}

export function DishPurchasePanel({
  dishId,
  dishName,
  imageUrl,
  caloriesPer100g,
  variants,
}: {
  dishId: string;
  dishName: string;
  imageUrl: string | null;
  caloriesPer100g: number | null;
  variants: Variant[];
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return <p className="text-char/50">Это блюдо временно недоступно.</p>;
  }

  function handleAdd() {
    addItem({
      dishId,
      dishVariantId: selected.id,
      name: dishName,
      variantLabel: selected.label,
      priceMinor: selected.priceMinor,
      imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div>
      {variants.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-char/60">Размер</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  v.id === selected.id
                    ? "border-ember bg-ember text-flatbread-2"
                    : "border-char/15 text-char/70 hover:border-char/30"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-4">
        <span className="font-sans text-3xl font-bold text-char">
          {formatMinor(selected.priceMinor)}
        </span>
        {selected.weightGrams && <span className="text-char/50">{selected.weightGrams} г</span>}
      </div>

      {caloriesPer100g && (
        <p className="mt-1 text-sm text-char/50">
          {caloriesPer100g} ккал / 100 г
          {selected.weightGrams &&
            ` · ≈ ${Math.round((caloriesPer100g * selected.weightGrams) / 100)} ккал в порции`}
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <Button size="lg" onClick={handleAdd}>
          {added ? "Добавлено ✓" : "В корзину"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => router.push("/cart")}>
          Перейти в корзину
        </Button>
      </div>
    </div>
  );
}
