"use client";

import { useTransition } from "react";
import { deleteHeroSlide } from "@/app/admin/(dashboard)/slides/actions";

export function DeleteHeroSlideButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Удалить слайд «${title}»?`)) {
          startTransition(() => deleteHeroSlide(id));
        }
      }}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      Удалить слайд
    </button>
  );
}
