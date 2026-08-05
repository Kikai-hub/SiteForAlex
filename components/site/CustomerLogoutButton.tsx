"use client";

import { useRouter } from "next/navigation";

export function CustomerLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm font-medium text-char/60 hover:text-char">
      Выйти
    </button>
  );
}
