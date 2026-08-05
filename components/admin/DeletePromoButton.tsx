"use client";

import { useTransition } from "react";
import { deletePromoCode } from "@/app/admin/(dashboard)/promo-codes/actions";

export function DeletePromoButton({ id, code }: { id: string; code: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Удалить промокод «${code}»?`)) {
          startTransition(() => deletePromoCode(id));
        }
      }}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      Удалить промокод
    </button>
  );
}
