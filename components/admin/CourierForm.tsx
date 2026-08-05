"use client";

import { useActionState } from "react";
import { createCourier, type ActionState } from "@/app/admin/(dashboard)/couriers/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function CourierForm() {
  const [state, formAction, pending] = useActionState(createCourier, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-2xl bg-flatbread-2 p-6">
      <div>
        <Label htmlFor="name">Имя курьера</Label>
        <Input id="name" name="name" required placeholder="Иван Иванов" />
      </div>
      <div>
        <Label htmlFor="username">Логин</Label>
        <Input id="username" name="username" required placeholder="ivan" autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Создаём…" : "Создать курьера"}
      </Button>
    </form>
  );
}
