"use client";

import { useState } from "react";

export function StarRatingInput({ name = "rating" }: { name?: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setValue(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
          aria-label={`Поставить оценку ${n}`}
        >
          <svg
            viewBox="0 0 20 20"
            className={`h-7 w-7 ${n <= shown ? "text-saffron" : "text-char/15"}`}
            fill="currentColor"
          >
            <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
