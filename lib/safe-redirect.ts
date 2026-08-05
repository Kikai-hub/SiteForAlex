/**
 * Restricts a redirect target to a same-app relative path, blocking
 * `next=https://evil.example` and protocol-relative `next=//evil.example`
 * open-redirect payloads passed through login query params.
 */
export function safeRedirectPath(target: string | null, fallback: string): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return fallback;
  }
  return target;
}
