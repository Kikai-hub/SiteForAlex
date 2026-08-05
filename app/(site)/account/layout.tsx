import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { formatPhoneForDisplay } from "@/lib/phone";
import { CustomerLogoutButton } from "@/components/site/CustomerLogoutButton";

const links = [
  { href: "/account", label: "Профиль" },
  { href: "/account/addresses", label: "Адреса" },
  { href: "/account/orders", label: "Заказы" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-char">
            {customer.name || "Личный кабинет"}
          </h1>
          <p className="text-sm text-char/50">{formatPhoneForDisplay(customer.phone)}</p>
        </div>
        <CustomerLogoutButton />
      </div>

      <nav className="mt-6 flex gap-2 border-b border-char/10">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-1 pb-3 text-sm font-semibold text-char/60 hover:text-char"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
