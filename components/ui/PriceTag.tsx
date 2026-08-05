import { formatMinor } from "@/lib/money";

/** Ticket-style price tag, echoing a handwritten tag clipped to a menu board. */
export function PriceTag({
  minor,
  className = "",
}: {
  minor: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block -rotate-2 rounded-md bg-char px-2.5 py-1 font-sans text-sm font-bold text-flatbread shadow-sm ${className}`}
    >
      {formatMinor(minor)}
    </span>
  );
}
