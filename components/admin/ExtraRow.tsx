"use client";

import { useActionState, useTransition } from "react";
import { updateExtra, deleteExtra, type ActionState } from "@/app/admin/(dashboard)/dishes/actions";
import { Input, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function ExtraRow({
  extra,
  dishId,
}: {
  extra: {
    id: string;
    name: string;
    priceMinor: number;
    maxQuantity: number;
    sortOrder: number;
    isActive: boolean;
    featured: boolean;
  };
  dishId: string;
}) {
  const boundAction = updateExtra.bind(null, extra.id, dishId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [deleting, startDelete] = useTransition();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-b border-char/5 py-3 last:border-0">
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Название</label>
        <Input name="name" defaultValue={extra.name} className="w-40" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Цена, ₽</label>
        <Input
          name="priceRubles"
          type="number"
          step="0.01"
          defaultValue={extra.priceMinor / 100}
          className="w-24"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Макс. кол-во</label>
        <Input name="maxQuantity" type="number" min={1} max={20} defaultValue={extra.maxQuantity} className="w-24" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Порядок</label>
        <Input name="sortOrder" type="number" defaultValue={extra.sortOrder} className="w-20" />
      </div>
      <label className="flex items-center gap-1.5 pb-2.5 text-xs font-medium text-char/60">
        <input type="checkbox" name="isActive" defaultChecked={extra.isActive} className="h-4 w-4 accent-ember" />
        Активен
      </label>
      <label className="flex items-center gap-1.5 pb-2.5 text-xs font-medium text-char/60">
        <input type="checkbox" name="featured" defaultChecked={extra.featured} className="h-4 w-4 accent-ember" />
        На странице блюда
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mb-0.5 rounded-full bg-char/10 px-3 py-1.5 text-xs font-semibold text-char hover:bg-char/15 disabled:opacity-50"
      >
        {pending ? "…" : "Сохранить"}
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => startDelete(() => deleteExtra(extra.id, dishId))}
        className="mb-0.5 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Удалить
      </button>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}
