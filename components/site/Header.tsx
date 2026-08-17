"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, cartItemCount } from "@/lib/store/cart";
import { useHasMounted } from "@/lib/useHasMounted";

const navLinks = [
  { href: "/menu", label: "Меню" },
  { href: "/#about", label: "О нас" },
  { href: "/#contacts", label: "Контакты" },
];

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = useCartStore((s) => s.items);
  const mounted = useHasMounted();
  const count = mounted ? cartItemCount(items) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-char/10 bg-flatbread/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Adana Pizza" width={159} height={134} className="h-10 w-auto" priority />
          <span className="font-display text-lg font-semibold leading-tight text-char">
            Adana Pizza
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-char/70 transition-colors hover:text-char"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="hidden text-[15px] font-medium text-char/70 hover:text-char sm:block"
          >
            {isLoggedIn ? "Личный кабинет" : "Войти"}
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-char text-flatbread"
            aria-label="Корзина"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2M7 13h10l3-7H6.4M7 13L5.4 5M7 13l-1.5 6h11M9 21a1 1 0 100-2 1 1 0 000 2zM17 21a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[11px] font-bold text-flatbread-2">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
