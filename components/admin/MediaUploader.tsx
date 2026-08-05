"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMedia, setPrimaryMedia } from "@/app/admin/(dashboard)/dishes/actions";
import { Button } from "@/components/ui/Button";

interface Media {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
  isPrimary: boolean;
}

export function MediaUploader({ dishId, media }: { dishId: string; media: Media[] }) {
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
      const res = await fetch(`/api/admin/dishes/${dishId}/media`, {
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
      <h2 className="font-display text-lg font-semibold text-char">Фото и видео</h2>
      <p className="mt-1 text-sm text-char/50">JPEG/PNG/WEBP до 15 МБ, MP4/WEBM до 100 МБ.</p>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {media.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-xl border border-char/10 bg-white">
            {m.type === "PHOTO" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" className="h-28 w-full object-cover" />
            ) : (
              <video src={m.url} className="h-28 w-full object-cover" muted />
            )}
            {m.isPrimary && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold uppercase text-flatbread-2">
                Главное
              </span>
            )}
            <div className="flex items-center justify-between gap-1 bg-flatbread-2 p-1.5">
              {!m.isPrimary && (
                <button
                  onClick={() => startTransition(() => setPrimaryMedia(m.id, dishId))}
                  className="text-[11px] font-medium text-ember hover:underline"
                >
                  Сделать главным
                </button>
              )}
              <button
                onClick={() => startTransition(() => deleteMedia(m.id, dishId))}
                className="ml-auto text-[11px] font-medium text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-char/10 pt-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelected(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Загружаем…" : "Загрузить"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
