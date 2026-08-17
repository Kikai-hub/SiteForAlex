"use client";

import { useEffect, useMemo, useState } from "react";
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

interface Extra {
  id: string;
  name: string;
  priceMinor: number;
  maxQuantity: number;
  featured: boolean;
}

interface Nutrition {
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
}

export function DishPurchasePanel({
  dishId,
  dishName,
  imageUrl,
  nutrition,
  variants,
  extras,
}: {
  dishId: string;
  dishName: string;
  imageUrl: string | null;
  nutrition: Nutrition;
  variants: Variant[];
  extras: Extra[];
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  const featuredExtras = useMemo(() => extras.filter((e) => e.featured), [extras]);
  const modalExtras = useMemo(() => extras.filter((e) => !e.featured), [extras]);

  const selectedExtras = useMemo(
    () =>
      extras
        .map((e) => ({ e, quantity: extraQuantities[e.id] ?? 0 }))
        .filter((x) => x.quantity > 0),
    [extras, extraQuantities]
  );
  const extrasTotalMinor = selectedExtras.reduce((sum, x) => sum + x.e.priceMinor * x.quantity, 0);
  const selectedModalExtras = selectedExtras.filter((x) => !x.e.featured);
  const modalExtrasTotalMinor = selectedModalExtras.reduce((sum, x) => sum + x.e.priceMinor * x.quantity, 0);

  useEffect(() => {
    if (!extrasOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExtrasOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [extrasOpen]);

  if (!selected) {
    return <p className="text-char/50">Это блюдо временно недоступно.</p>;
  }

  function setExtraQuantity(extraId: string, quantity: number, max: number) {
    setExtraQuantities((prev) => ({ ...prev, [extraId]: Math.max(0, Math.min(quantity, max)) }));
  }

  function handleAdd() {
    addItem({
      dishId,
      dishVariantId: selected.id,
      name: dishName,
      variantLabel: selected.label,
      priceMinor: selected.priceMinor,
      imageUrl,
      extras: selectedExtras.map(({ e, quantity }) => ({
        dishExtraId: e.id,
        name: e.name,
        priceMinor: e.priceMinor,
        quantity,
      })),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  const hasNutrition =
    nutrition.caloriesPer100g != null ||
    nutrition.proteinPer100g != null ||
    nutrition.fatPer100g != null ||
    nutrition.carbsPer100g != null;

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
          {formatMinor(selected.priceMinor + extrasTotalMinor)}
        </span>
        {selected.weightGrams && <span className="text-char/50">{selected.weightGrams} г</span>}
      </div>

      {hasNutrition && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-char/50">
          {nutrition.caloriesPer100g != null && (
            <span>
              {nutrition.caloriesPer100g} ккал
              {selected.weightGrams &&
                ` · ≈ ${Math.round((nutrition.caloriesPer100g * selected.weightGrams) / 100)} ккал/порция`}
            </span>
          )}
          {nutrition.proteinPer100g != null && <span>Белки {nutrition.proteinPer100g} г</span>}
          {nutrition.fatPer100g != null && <span>Жиры {nutrition.fatPer100g} г</span>}
          {nutrition.carbsPer100g != null && <span>Углеводы {nutrition.carbsPer100g} г</span>}
          {hasNutrition && <span className="basis-full text-xs text-char/35">на 100 г</span>}
        </div>
      )}

      {featuredExtras.length > 0 && (
        <div className="mt-5 space-y-2">
          {featuredExtras.map((e) => {
            const qty = extraQuantities[e.id] ?? 0;
            if (e.maxQuantity === 1) {
              const active = qty > 0;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setExtraQuantity(e.id, active ? 0 : 1, e.maxQuantity)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    active ? "border-ember bg-ember/10" : "border-char/15 hover:border-char/30"
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-char">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] ${
                        active ? "border-ember bg-ember text-flatbread-2" : "border-char/25"
                      }`}
                    >
                      {active && "✓"}
                    </span>
                    {e.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ember">+{formatMinor(e.priceMinor)}</span>
                </button>
              );
            }
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-char/15 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-char">{e.name}</p>
                  <p className="text-xs text-char/50">+{formatMinor(e.priceMinor)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraQuantity(e.id, qty - 1, e.maxQuantity)}
                    disabled={qty === 0}
                    className="h-7 w-7 rounded-full bg-char/10 text-char hover:bg-char/15 disabled:opacity-30"
                    aria-label={`Меньше «${e.name}»`}
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-medium">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setExtraQuantity(e.id, qty + 1, e.maxQuantity)}
                    disabled={qty >= e.maxQuantity}
                    className="h-7 w-7 rounded-full bg-char/10 text-char hover:bg-char/15 disabled:opacity-30"
                    aria-label={`Больше «${e.name}»`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalExtras.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setExtrasOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-char/15 px-4 py-3 text-left transition-colors hover:border-char/30"
          >
            <span className="min-w-0">
              <span className="text-sm font-semibold text-char">Дополнить заказ</span>
              {selectedModalExtras.length > 0 && (
                <span className="mt-0.5 block truncate text-xs text-char/50">
                  {selectedModalExtras
                    .map(({ e, quantity }) => `${e.name}${quantity > 1 ? ` ×${quantity}` : ""}`)
                    .join(", ")}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm font-semibold text-ember">
              {selectedModalExtras.length > 0 ? `+${formatMinor(modalExtrasTotalMinor)}` : "Выбрать"}
            </span>
          </button>
        </div>
      )}

      {extrasOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-char/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setExtrasOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-flatbread p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Дополнительно"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-char">Дополнительно</h2>
              <button
                type="button"
                onClick={() => setExtrasOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-char/40 hover:bg-char/10 hover:text-char"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
              {modalExtras.map((e) => {
                const qty = extraQuantities[e.id] ?? 0;
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-char/10 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-char">{e.name}</p>
                      <p className="text-xs text-char/50">+{formatMinor(e.priceMinor)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExtraQuantity(e.id, qty - 1, e.maxQuantity)}
                        disabled={qty === 0}
                        className="h-7 w-7 rounded-full bg-char/10 text-char hover:bg-char/15 disabled:opacity-30"
                        aria-label={`Меньше «${e.name}»`}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setExtraQuantity(e.id, qty + 1, e.maxQuantity)}
                        disabled={qty >= e.maxQuantity}
                        className="h-7 w-7 rounded-full bg-char/10 text-char hover:bg-char/15 disabled:opacity-30"
                        aria-label={`Больше «${e.name}»`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button size="lg" className="mt-5 w-full" onClick={() => setExtrasOpen(false)}>
              Готово{modalExtrasTotalMinor > 0 ? ` · +${formatMinor(modalExtrasTotalMinor)}` : ""}
            </Button>
          </div>
        </div>
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
