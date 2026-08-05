/** CSS-drawn pizza roundel used as the hero's signature visual — stands in for
 *  a product photo until the admin uploads real ones, and doubles as a motif
 *  echoed in category icons. Not a stock illustration: built from the same
 *  stamp/scallop shape as the rest of the brand. */
export function PizzaMark({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-full bg-saffron/25 blur-2xl" />
      <div className="stamp-shape relative flex aspect-square items-center justify-center bg-gradient-to-br from-saffron via-ember to-ember-dark shadow-2xl">
        <div className="stamp-shape absolute inset-[7%] bg-gradient-to-br from-[#f3d48a] to-[#e0a13d]" />
        <div className="absolute inset-[16%] rounded-full bg-gradient-to-br from-[#fbeecb] to-[#f2d99a]" />
        {[
          [28, 30], [68, 24], [50, 46], [22, 62], [76, 58], [45, 74], [62, 68], [35, 40],
        ].map(([x, y], i) => (
          <span
            key={i}
            className="absolute h-[7%] w-[7%] rounded-full bg-ember-dark/80"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
        <span className="absolute inset-[16%] rounded-full ring-2 ring-char/10" />
      </div>
    </div>
  );
}
