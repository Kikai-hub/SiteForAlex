"use client";

import { useActionState } from "react";
import { createExtra, type ActionState } from "@/app/admin/(dashboard)/dishes/actions";
import { ExtraRow } from "@/components/admin/ExtraRow";
import { Button } from "@/components/ui/Button";
import { Input, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function ExtraEditor({
  dishId,
  extras,
}: {
  dishId: string;
  extras: {
    id: string;
    name: string;
    priceMinor: number;
    maxQuantity: number;
    sortOrder: number;
    isActive: boolean;
    featured: boolean;
  }[];
}) {
  const boundAction = createExtra.bind(null, dishId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <div className="rounded-2xl bg-flatbread-2 p-6">
      <h2 className="font-display text-lg font-semibold text-char">Допы (дозаказ ингредиентов)</h2>
      <p className="mt-1 text-sm text-char/50">
        Позиции, которые клиент сможет добавить к этому блюду — например «двойной сыр».
      </p>

      <div className="mt-3">
        {extras.map((e) => (
          <ExtraRow key={e.id} extra={e} dishId={dishId} />
        ))}
        {extras.length === 0 && (
          <p className="py-2 text-sm text-char/50">Пока нет допов — добавьте первый ниже.</p>
        )}
      </div>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-char/10 pt-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-char/50">Название</label>
          <Input name="name" placeholder="Двойной сыр" className="w-40" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-char/50">Цена, ₽</label>
          <Input name="priceRubles" type="number" step="0.01" placeholder="99" className="w-24" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-char/50">Макс. кол-во</label>
          <Input name="maxQuantity" type="number" min={1} max={20} placeholder="5" className="w-24" />
        </div>
        <label className="flex items-center gap-1.5 pb-2.5 text-xs font-medium text-char/60">
          <input type="checkbox" name="featured" className="h-4 w-4 accent-ember" />
          Показывать сразу на странице блюда
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Добавить доп"}
        </Button>
      </form>
      <FieldError>{state.error}</FieldError>
    </div>
  );
}
