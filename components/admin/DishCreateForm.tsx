"use client";

import { useActionState } from "react";
import { createDish, type ActionState } from "@/app/admin/(dashboard)/dishes/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function DishCreateForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createDish, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-2xl bg-flatbread-2 p-6">
      <div>
        <Label htmlFor="categoryId">Категория</Label>
        <Select id="categoryId" name="categoryId" required defaultValue="">
          <option value="" disabled>
            Выберите категорию
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" required placeholder="Пепперони" />
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" rows={3} placeholder="Острая пепперони, моцарелла…" />
      </div>
      <div className="flex items-end gap-4">
        <div className="w-32">
          <Label htmlFor="sortOrder">Порядок</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
        </div>
        <div className="w-40">
          <Label htmlFor="caloriesPer100g">Калорийность, ккал/100 г</Label>
          <Input
            id="caloriesPer100g"
            name="caloriesPer100g"
            type="number"
            min={1}
            placeholder="250"
            required
            onInvalid={(e) => e.currentTarget.setCustomValidity("Нельзя оставить поле пустым")}
            onInput={(e) => e.currentTarget.setCustomValidity("")}
          />
        </div>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Создаём…" : "Создать блюдо"}
      </Button>
    </form>
  );
}
