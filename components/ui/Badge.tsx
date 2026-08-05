const toneClasses = {
  ember: "bg-ember/10 text-ember-dark",
  saffron: "bg-saffron/20 text-char",
  herb: "bg-herb/15 text-herb",
  neutral: "bg-char/8 text-char/70",
} as const;

export function Badge({
  children,
  tone = "ember",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
