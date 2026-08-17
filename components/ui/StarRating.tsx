export function StarRating({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" aria-label={`Оценка ${value.toFixed(1)} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={`relative ${dims}`}>
            <svg viewBox="0 0 20 20" className={`${dims} text-char/15`} fill="currentColor">
              <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
            </svg>
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <svg viewBox="0 0 20 20" className={`${dims} text-saffron`} fill="currentColor">
                  <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
