"use client";

import { useActionState, useTransition } from "react";
import { updateVariant, deleteVariant, type ActionState } from "@/app/admin/(dashboard)/dishes/actions";
import { Input, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function VariantRow({
  variant,
  dishId,
}: {
  variant: {
    id: string;
    label: string;
    priceMinor: number;
    weightGrams: number | null;
    sortOrder: number;
    isActive: boolean;
  };
  dishId: string;
}) {
  const boundAction = updateVariant.bind(null, variant.id, dishId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [deleting, startDelete] = useTransition();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-b border-char/5 py-3 last:border-0">
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Размер</label>
        <Input name="label" defaultValue={variant.label} className="w-32" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Цена, ₽</label>
        <Input
          name="priceRubles"
          type="number"
          step="0.01"
          defaultValue={variant.priceMinor / 100}
          className="w-28"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Вес, г</label>
        <Input
          name="weightGrams"
          type="number"
          defaultValue={variant.weightGrams ?? ""}
          placeholder="грамм"
          className="w-24"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-char/50">Порядок</label>
        <Input name="sortOrder" type="number" defaultValue={variant.sortOrder} className="w-20" />
      </div>
      <label className="flex items-center gap-1.5 pb-2.5 text-xs font-medium text-char/60">
        <input type="checkbox" name="isActive" defaultChecked={variant.isActive} className="h-4 w-4 accent-ember" />
        Активен
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
        onClick={() => startDelete(() => deleteVariant(variant.id, dishId))}
        className="mb-0.5 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Удалить
      </button>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}
