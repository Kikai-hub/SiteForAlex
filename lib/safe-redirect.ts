/**
 * Restricts a redirect target to a same-app relative path, blocking
 * `next=https://evil.example` and protocol-relative `next=//evil.example`
 * open-redirect payloads passed through login query params.
 *
 * Resolves against a sentinel base with the WHATWG URL parser (rather than
 * pattern-matching the raw string) so browser URL-normalization quirks can't
 * sneak a cross-origin target past the check — e.g. a leading backslash or an
 * embedded tab/CR/LF is stripped/normalized by `new URL()` (and by browsers'
 * own navigation resolution) into an effective `//evil.example`, which a
 * naive `startsWith("//")` guard on the unresolved string would miss.
 */
export function safeRedirectPath(target: string | null, fallback: string): string {
  if (!target || !target.startsWith("/")) return fallback;

  const sentinelOrigin = "http://internal.invalid";
  let resolved: URL;
  try {
    resolved = new URL(target, sentinelOrigin);
  } catch {
    return fallback;
  }
  if (resolved.origin !== sentinelOrigin) return fallback;

  return target;
}
