"use client";

import { useState, useTransition } from "react";
import { deleteCourier } from "@/app/admin/(dashboard)/couriers/actions";

export function DeleteCourierButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Удалить курьера «${name}»?`)) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteCourier(id);
            if (result?.error) setError(result.error);
          });
        }}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Удалить
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
