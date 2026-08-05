"use client";

import { useActionState } from "react";
import { createVariant, type ActionState } from "@/app/admin/(dashboard)/dishes/actions";
import { VariantRow } from "@/components/admin/VariantRow";
import { Button } from "@/components/ui/Button";
import { Input, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function VariantEditor({
  dishId,
  variants,
}: {
  dishId: string;
  variants: {
    id: string;
    label: string;
    priceMinor: number;
    weightGrams: number | null;
    sortOrder: number;
    isActive: boolean;
  }[];
}) {
  const boundAction = createVariant.bind(null, dishId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <div className="rounded-2xl bg-flatbread-2 p-6">
      <h2 className="font-display text-lg font-semibold text-char">Размеры и цены</h2>

      <div className="mt-3">
        {variants.map((v) => (
          <VariantRow key={v.id} variant={v} dishId={dishId} />
        ))}
        {variants.length === 0 && (
          <p className="py-2 text-sm text-char/50">Пока нет ни одного варианта — добавьте первый ниже.</p>
        )}
      </div>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-char/10 pt-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-char/50">Размер</label>
          <Input name="label" placeholder="33 см" className="w-32" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-char/50">Цена, ₽</label>
          <Input name="priceRubles" type="number" step="0.01" placeholder="499" className="w-28" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-char/50">Вес, г</label>
          <Input name="weightGrams" type="number" placeholder="650" className="w-24" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Добавить вариант"}
        </Button>
      </form>
      <FieldError>{state.error}</FieldError>
    </div>
  );
}
