"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markDelivered } from "@/app/courier/(dashboard)/actions";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Input";

export function DeliveredButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelivered() {
    if (!confirm(`Подтвердить доставку заказа №${orderId}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await markDelivered(orderId);
      if (result.error) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Button onClick={handleDelivered} disabled={pending} className="w-full">
        {pending ? "Отмечаем…" : "Доставлено"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
