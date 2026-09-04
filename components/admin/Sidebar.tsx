"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Обзор", exact: true },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/dishes", label: "Меню" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/slides", label: "Слайдер на главной" },
  { href: "/admin/comments", label: "Комментарии" },
  { href: "/admin/promo-codes", label: "Промокоды" },
  { href: "/admin/couriers", label: "Курьеры" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-ember text-flatbread-2" : "text-flatbread-2/70 hover:bg-charcoal-2 hover:text-flatbread-2"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
