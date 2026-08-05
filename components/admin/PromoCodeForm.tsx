"use client";

import { useActionState, useState } from "react";
import { createPromoCode, updatePromoCode, type ActionState } from "@/app/admin/(dashboard)/promo-codes/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

function toLocalInputValue(date: Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function PromoCodeForm({
  promo,
}: {
  promo?: {
    id: string;
    code: string;
    type: "PERCENT" | "FIXED";
    value: number;
    minOrderAmountMinor: number | null;
    maxUsesTotal: number | null;
    maxUsesPerCustomer: number | null;
    startsAt: Date | null;
    expiresAt: Date | null;
    isActive: boolean;
  };
}) {
  const action = promo ? updatePromoCode.bind(null, promo.id) : createPromoCode;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<"PERCENT" | "FIXED">(promo?.type ?? "PERCENT");

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-2xl bg-flatbread-2 p-6">
      <div>
        <Label htmlFor="code">Код</Label>
        <Input
          id="code"
          name="code"
          required
          defaultValue={promo?.code}
          placeholder="ADANA10"
          className="uppercase"
        />
      </div>

      <div className="flex gap-4">
        <div className="w-40">
          <Label htmlFor="type">Тип скидки</Label>
          <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}>
            <option value="PERCENT">Процент</option>
            <option value="FIXED">Фикс. сумма</option>
          </Select>
        </div>
        <div className="w-40">
          <Label htmlFor="value">{type === "PERCENT" ? "Процент, %" : "Сумма, ₽"}</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step={type === "PERCENT" ? "1" : "0.01"}
            required
            defaultValue={promo ? (promo.type === "FIXED" ? promo.value / 100 : promo.value) : undefined}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="minOrderAmountRubles">Мин. сумма заказа, ₽ (необязательно)</Label>
        <Input
          id="minOrderAmountRubles"
          name="minOrderAmountRubles"
          type="number"
          step="0.01"
          defaultValue={promo?.minOrderAmountMinor != null ? promo.minOrderAmountMinor / 100 : undefined}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="maxUsesTotal">Лимит использований всего</Label>
          <Input id="maxUsesTotal" name="maxUsesTotal" type="number" defaultValue={promo?.maxUsesTotal ?? undefined} />
        </div>
        <div className="flex-1">
          <Label htmlFor="maxUsesPerCustomer">Лимит на клиента</Label>
          <Input
            id="maxUsesPerCustomer"
            name="maxUsesPerCustomer"
            type="number"
            defaultValue={promo?.maxUsesPerCustomer ?? undefined}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="startsAt">Начало действия</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={toLocalInputValue(promo?.startsAt)} />
        </div>
        <div className="flex-1">
          <Label htmlFor="expiresAt">Окончание действия</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={toLocalInputValue(promo?.expiresAt)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-char/70">
        <input type="checkbox" name="isActive" defaultChecked={promo?.isActive ?? true} className="h-4 w-4 accent-ember" />
        Промокод активен
      </label>

      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : promo ? "Сохранить" : "Создать промокод"}
      </Button>
    </form>
  );
}
