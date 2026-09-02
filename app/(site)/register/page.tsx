"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, personalDataConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось зарегистрироваться");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl font-semibold text-char">Регистрация</h1>
      <p className="mt-1 text-char/60">Понадобится только телефон и пароль.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Имя</Label>
          <Input id="name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Телефон</Label>
          <PhoneInput
            id="phone"
            required
            value={phone}
            onValueChange={setPhone}
          />
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-char/70">
          <input
            type="checkbox"
            required
            checked={personalDataConsent}
            onChange={(e) => setPersonalDataConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-ember"
          />
          <span>
            Я согласен(на) с{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-ember hover:underline">
              обработкой персональных данных
            </Link>
          </span>
        </label>
        <FieldError>{error}</FieldError>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-char/60">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-semibold text-ember hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
