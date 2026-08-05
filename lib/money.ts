/** All prices are stored as integer minor units (kopecks) to avoid float rounding. */

export function toMinor(rubles: number): number {
  return Math.round(rubles * 100);
}

export function formatMinor(minor: number): string {
  const rubles = minor / 100;
  return `${rubles.toLocaleString("ru-RU", {
    minimumFractionDigits: rubles % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ₽`;
}
