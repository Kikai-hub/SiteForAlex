/**
 * The site's signature shape: a hand-cut scalloped disc, like a stamped round
 * of dough or a wax seal. Used for the logo mark, category icons, and photo
 * placeholders so the site still looks designed before real dish photos exist.
 */
export function Stamp({
  children,
  className = "",
  tone = "ember",
}: {
  children?: React.ReactNode;
  className?: string;
  tone?: "ember" | "charcoal" | "flatbread";
}) {
  const toneClasses = {
    ember: "bg-ember text-flatbread-2",
    charcoal: "bg-charcoal text-saffron",
    flatbread: "bg-flatbread-2 text-ember border border-ember/20",
  }[tone];

  return (
    <div
      className={`stamp-shape flex items-center justify-center ${toneClasses} ${className}`}
    >
      {children}
    </div>
  );
}
