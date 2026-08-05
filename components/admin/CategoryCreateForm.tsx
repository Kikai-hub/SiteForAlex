"use client";

import { useActionState } from "react";
import { createCategory, type ActionState } from "@/app/admin/(dashboard)/categories/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-2xl bg-flatbread-2 p-5">
      <div className="w-48">
        <Label htmlFor="name">Название</Label>
        <Input id="name" name="name" required placeholder="Пиццы" />
      </div>
      <div className="w-40">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required placeholder="pizzas" pattern="[a-z0-9-]+" />
      </div>
      <div className="w-24">
        <Label htmlFor="sortOrder">Порядок</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Добавляем…" : "Добавить категорию"}
      </Button>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}
