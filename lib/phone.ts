/**
 * Normalizes Russian phone numbers to a canonical "+7XXXXXXXXXX" form so that
 * "8 993 259-01-43", "+7(993)2590143", etc. all collapse to the same value
 * for storage/comparison (Customer.phone uniqueness, guest promo matching).
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let national: string;
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  } else {
    return null;
  }

  if (!/^\d{10}$/.test(national)) return null;
  return `+7${national}`;
}

export function formatPhoneForDisplay(normalized: string): string {
  const match = normalized.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return normalized;
  const [, a, b, c, d] = match;
  return `+7 (${a}) ${b}-${c}-${d}`;
}

/**
 * Formats a phone number as the user types it, keeping "+7" pinned to the
 * start as soon as any digit is entered (empty input stays empty so the
 * placeholder still shows). A leading 7 or 8 typed by the user is treated as
 * the country code, not a local digit.
 */
export function maskPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";

  let out = "+7";
  out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ")";
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}
