"use client";

import { useState } from "react";
import { Stamp } from "@/components/ui/Stamp";

interface Media {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
}

export function DishGallery({ media, dishName }: { media: Media[]; dishName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex];

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-gradient-to-br from-saffron/20 to-ember/10">
        <Stamp tone="flatbread" className="h-32 w-32 text-4xl font-display font-semibold">
          {dishName.slice(0, 1)}
        </Stamp>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-3xl bg-flatbread-2">
        {active.type === "PHOTO" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={dishName} className="h-full w-full object-cover" />
        ) : (
          <video src={active.url} controls className="h-full w-full object-cover" />
        )}
      </div>
      {media.length > 1 && (
        <div className="mt-3 flex gap-2">
          {media.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                i === activeIndex ? "border-ember" : "border-transparent"
              }`}
            >
              {m.type === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <video src={m.url} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
