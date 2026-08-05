"use client";

import { useRouter } from "next/navigation";

export function CourierLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/courier/logout", { method: "POST" });
    router.push("/courier/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm font-medium text-char/60 hover:text-char">
      Выйти
    </button>
  );
}
