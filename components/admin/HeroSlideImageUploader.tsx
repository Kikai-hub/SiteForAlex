"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeHeroSlideImage } from "@/app/admin/(dashboard)/slides/actions";
import { Button } from "@/components/ui/Button";

export function HeroSlideImageUploader({ slideId, imageUrl }: { slideId: string; imageUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleFileSelected(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/hero-slides/${slideId}/image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось загрузить файл");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-flatbread-2 p-6">
      <h2 className="font-display text-lg font-semibold text-char">Изображение баннера</h2>
      <p className="mt-1 text-sm text-char/50">
        JPEG/PNG/WEBP до 15 МБ, минимум <strong>1800×1200</strong>, пропорция около 3:2 (альбомная, от 4:3 до
        5:3) — система откажет в загрузке фото с другим размером или пропорциями. Изображение растягивается на
        весь баннер: на компьютере обрезаются верх/низ, на телефоне — края слева/справа. Располагайте блюдо в
        правой трети кадра, по центру по высоте, с запасом пустого пространства вокруг — тогда оно не
        потеряется ни в одной, ни в другой обрезке.
      </p>

      {imageUrl && (
        <div className="mt-4 overflow-hidden rounded-xl border border-char/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-char/10 pt-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
          }}
        />
        <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Загружаем…" : imageUrl ? "Заменить" : "Загрузить"}
        </Button>
        {imageUrl && (
          <button
            type="button"
            onClick={() => startTransition(() => removeHeroSlideImage(slideId))}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Удалить изображение
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
