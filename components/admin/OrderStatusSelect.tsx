"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/(dashboard)/orders/actions";
import { Select } from "@/components/ui/Input";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/orderStatus";

export function OrderStatusSelect({ orderId, status }: { orderId: number; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => startTransition(() => updateOrderStatus(orderId, e.target.value))}
        className="w-56"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      {pending && <span className="text-xs text-char/50">Сохраняем…</span>}
    </div>
  );
}
