"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimOrder } from "@/app/courier/(dashboard)/actions";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Input";

export function ClaimOrderButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimOrder(orderId);
      if (result.error) {
        setError(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Button size="sm" onClick={handleClaim} disabled={pending}>
        {pending ? "Забираем…" : "Взять заказ"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
