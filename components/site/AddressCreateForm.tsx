"use client";

import { useActionState, useRef } from "react";
import { createAddress, type ActionState } from "@/app/(site)/account/addresses/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { AddressAutocomplete } from "@/components/site/AddressAutocomplete";

const initialState: ActionState = {};

export function AddressCreateForm() {
  const [state, formAction, pending] = useActionState(createAddress, initialState);
  const cityRef = useRef<HTMLInputElement>(null);
  const houseRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl bg-flatbread-2 p-5">
      <h2 className="font-display text-lg font-semibold text-char">Новый адрес</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="label">Название (необязательно)</Label>
          <Input id="label" name="label" placeholder="Дом, Работа…" />
        </div>
        <div>
          <Label htmlFor="city">Город</Label>
          <Input ref={cityRef} id="city" name="city" defaultValue="Москва" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <AddressAutocomplete
          id="street"
          name="street"
          label="Улица"
          required
          cityInputRef={cityRef}
          houseInputRef={houseRef}
        />
        <div>
          <Label htmlFor="house">Дом</Label>
          <Input ref={houseRef} id="house" name="house" required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="apartment">Квартира</Label>
          <Input id="apartment" name="apartment" />
        </div>
        <div>
          <Label htmlFor="entrance">Подъезд</Label>
          <Input id="entrance" name="entrance" />
        </div>
        <div>
          <Label htmlFor="floor">Этаж</Label>
          <Input id="floor" name="floor" />
        </div>
      </div>
      <div>
        <Label htmlFor="comment">Комментарий</Label>
        <Input id="comment" name="comment" placeholder="Код домофона и т.д." />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-char/70">
        <input type="checkbox" name="isDefault" className="h-4 w-4 accent-ember" />
        Сделать основным адресом
      </label>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Добавить адрес"}
      </Button>
    </form>
  );
}
