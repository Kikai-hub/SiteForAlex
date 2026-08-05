"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { safeRedirectPath } from "@/lib/safe-redirect";

function CourierLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/courier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось войти");
        return;
      }
      router.push(safeRedirectPath(params.get("next"), "/courier"));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-flatbread-2 p-8 shadow-xl"
      >
        <h1 className="font-display text-2xl font-semibold text-char">Кабинет курьера</h1>
        <p className="mt-1 text-sm text-char/60">Adana Pizza — вход по логину и паролю</p>

        <div className="mt-6">
          <Label htmlFor="username">Логин</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FieldError>{error}</FieldError>

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </Button>
      </form>
    </div>
  );
}

export default function CourierLoginPage() {
  return (
    <Suspense>
      <CourierLoginForm />
    </Suspense>
  );
}
