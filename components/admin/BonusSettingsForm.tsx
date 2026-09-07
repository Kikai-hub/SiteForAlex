"use client";

import { useActionState } from "react";
import { updateBonusSettings, type ActionState } from "@/app/admin/(dashboard)/bonus-settings/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function BonusSettingsForm({
  earnPercent,
  maxRedeemPercent,
}: {
  earnPercent: number;
  maxRedeemPercent: number;
}) {
  const [state, formAction, pending] = useActionState(updateBonusSettings, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-2xl bg-flatbread-2 p-6">
      <div>
        <Label htmlFor="earnPercent">Начисление баллов, % от суммы заказа</Label>
        <Input
          id="earnPercent"
          name="earnPercent"
          type="number"
          min={0}
          max={100}
          required
          defaultValue={earnPercent}
        />
        <p className="mt-1.5 text-xs text-char/50">
          Начисляется после того, как заказ отмечен как доставленный/выполненный.
        </p>
      </div>
      <div>
        <Label htmlFor="maxRedeemPercent">Максимум списания баллами, % от суммы заказа</Label>
        <Input
          id="maxRedeemPercent"
          name="maxRedeemPercent"
          type="number"
          min={0}
          max={100}
          required
          defaultValue={maxRedeemPercent}
        />
        <p className="mt-1.5 text-xs text-char/50">
          1 балл = 1 ₽ скидки. Списать баллы можно только за блюда, у которых включена соответствующая
          настройка (см. карточку блюда) — и не больше этого процента от суммы заказа.
        </p>
      </div>

      <FieldError>{state.error}</FieldError>
      {!pending && !state.error && state.ok && <p className="text-sm font-medium text-green-700">Сохранено.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  );
}
