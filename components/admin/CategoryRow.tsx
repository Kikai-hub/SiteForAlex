"use client";

import { useState, useTransition } from "react";
import { toggleCategoryActive, deleteCategory } from "@/app/admin/(dashboard)/categories/actions";

export function CategoryRow({
  id,
  name,
  slug,
  sortOrder,
  isActive,
  dishCount,
}: {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  dishCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-char/5 last:border-0">
      <td className="px-4 py-3 font-medium">{name}</td>
      <td className="px-4 py-3 text-char/50">{slug}</td>
      <td className="px-4 py-3 text-char/50">{sortOrder}</td>
      <td className="px-4 py-3 text-char/50">{dishCount}</td>
      <td className="px-4 py-3">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              toggleCategoryActive(id, !isActive);
            })
          }
          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
            isActive ? "bg-herb/15 text-herb" : "bg-char/10 text-char/50"
          }`}
        >
          {isActive ? "Активна" : "Скрыта"}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await deleteCategory(id);
              if (res?.error) setError(res.error);
            })
          }
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Удалить
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
