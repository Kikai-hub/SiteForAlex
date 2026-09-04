"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export interface HeroSlideData {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  badgeText: string | null;
  priceLabel: string | null;
  ctaLabel: string;
  ctaHref: string;
}

const AUTOPLAY_MS = 10000;

export function HeroSlider({ slides }: { slides: HeroSlideData[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={slide.id} className="w-full shrink-0 px-5 py-6 md:py-8" aria-hidden={i !== index}>
              <div className="relative mx-auto min-h-[440px] max-w-6xl overflow-hidden rounded-3xl bg-flatbread-2 md:min-h-[460px]">
                {/* Background photo — fills the whole slide, cropped to fit (object-cover).
                    The card is ~2.5:1 on desktop but ~0.8:1 on phones, so desktop crops
                    top/bottom while mobile crops left/right; object-position biases the
                    crop toward the right-of-center framing recommended in the admin
                    uploader (see HeroSlideImageUploader) so the dish survives both. */}
                {slide.imageUrl && (
                  <Image
                    src={slide.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1152px) 1152px, 100vw"
                    priority={i === 0}
                    className="object-cover object-[70%_50%]"
                  />
                )}
                {/* Scrim so the text stays legible over the photo: solid on the text's
                    side, fading to fully transparent so the photo shows through clearly
                    on the rest of the banner — bottom-up on phones (stacked), left-right
                    on desktop (photo visible on the right, like the two-column layout). */}
                <div className="absolute inset-0 bg-gradient-to-t from-flatbread from-15% via-flatbread/85 via-55% to-flatbread/10 md:bg-gradient-to-r md:from-flatbread md:from-5% md:via-flatbread/95 md:via-45% md:to-transparent md:to-80%" />

                <div className="relative flex h-full min-h-[440px] items-end px-6 pb-8 pt-40 md:min-h-[460px] md:items-center md:px-14 md:py-14">
                  <div className="max-w-md">
                    {slide.badgeText && (
                      <span className="text-sm font-bold uppercase tracking-widest text-ember">
                        {slide.badgeText}
                      </span>
                    )}
                    <h1 className="mt-4 line-clamp-3 font-display text-4xl font-semibold leading-[1.05] text-char md:text-5xl">
                      {slide.title}
                    </h1>
                    {slide.subtitle && (
                      <p className="mt-3 text-lg font-medium italic text-ember">{slide.subtitle}</p>
                    )}
                    {slide.description && (
                      <p className="mt-4 line-clamp-3 text-lg text-char/70">{slide.description}</p>
                    )}
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Link href={slide.ctaHref} tabIndex={i === index ? 0 : -1}>
                        <Button size="lg">{slide.ctaLabel}</Button>
                      </Link>
                      {slide.priceLabel && (
                        <span className="font-sans text-2xl font-bold text-char">{slide.priceLabel}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Предыдущий слайд"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-flatbread-2/80 p-2.5 text-char shadow-md transition-colors hover:bg-flatbread-2 md:flex"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Следующий слайд"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-flatbread-2/80 p-2.5 text-char shadow-md transition-colors hover:bg-flatbread-2 md:flex"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex justify-center gap-2 pb-6">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Показать слайд ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-ember" : "w-2 bg-char/20 hover:bg-char/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
