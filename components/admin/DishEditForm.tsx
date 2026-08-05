"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateDish, deleteDish, type ActionState } from "@/app/admin/(dashboard)/dishes/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function DishEditForm({
  dish,
  categories,
}: {
  dish: {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    caloriesPer100g: number | null;
    sortOrder: number;
    isActive: boolean;
  };
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const boundAction = updateDish.bind(null, dish.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  async function handleDelete() {
    if (!confirm(`Удалить блюдо «${dish.name}»? Это действие необратимо.`)) return;
    await deleteDish(dish.id);
    router.push("/admin/dishes");
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-flatbread-2 p-6">
      <div>
        <Label htmlFor="categoryId">Категория</Label>
        <Select id="categoryId" name="categoryId" required defaultValue={dish.categoryId}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" required defaultValue={dish.name} />
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={dish.description ?? ""} />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-32">
          <Label htmlFor="sortOrder">Порядок</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={dish.sortOrder} />
        </div>
        <div className="w-40">
          <Label htmlFor="caloriesPer100g">Калорийность, ккал/100 г</Label>
          <Input
            id="caloriesPer100g"
            name="caloriesPer100g"
            type="number"
            min={1}
            placeholder="250"
            defaultValue={dish.caloriesPer100g ?? ""}
            required
            onInvalid={(e) => e.currentTarget.setCustomValidity("Нельзя оставить поле пустым")}
            onInput={(e) => e.currentTarget.setCustomValidity("")}
          />
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-char/70">
          <input type="checkbox" name="isActive" defaultChecked={dish.isActive} className="h-4 w-4 accent-ember" />
          Показывать в меню
        </label>
      </div>
      <FieldError>{state.error}</FieldError>
      <div className="flex items-center justify-between pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Сохраняем…" : "Сохранить"}
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Удалить блюдо
        </button>
      </div>
    </form>
  );
}
