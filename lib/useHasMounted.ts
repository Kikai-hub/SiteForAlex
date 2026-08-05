import { useEffect, useState } from "react";

/**
 * Cart state is persisted to localStorage (Zustand `persist`), so the first
 * client render must match the server's empty-cart HTML before hydrating the
 * real value — otherwise React logs a hydration mismatch. This flips to true
 * right after mount, once client-only storage is safe to read.
 */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional SSR/client hydration guard, not a synchronization effect
    setMounted(true);
  }, []);
  return mounted;
}
