"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { Input, Label, FieldError } from "@/components/ui/Input";

interface Suggestion {
  label: string;
  subtitle: string | null;
  uri: string | null;
  city: string | null;
  street: string | null;
  house: string | null;
  isHouseLevel: boolean;
  deliveryEtaMinutes: number | null;
}

interface AddressAutocompleteProps {
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  /** Sibling "Город" input to auto-fill once an address resolves. */
  cityInputRef?: RefObject<HTMLInputElement | null>;
  /** Sibling "Дом" input to auto-fill once an address resolves. */
  houseInputRef?: RefObject<HTMLInputElement | null>;
}

export function AddressAutocomplete({
  id = "street",
  name = "street",
  label,
  required,
  defaultValue = "",
  cityInputRef,
  houseInputRef,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [eta, setEta] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleQueryChange(next: string) {
    setQuery(next);

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    setStatus("idle");
    setEta(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = next.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address/suggest?text=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const results: Suggestion[] = data.suggestions ?? [];
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function applyResolved(resolved: {
    city: string | null;
    house: string | null;
    isValid: boolean;
    deliveryEtaMinutes: number | null;
  }) {
    if (resolved.isValid) {
      setStatus("valid");
      setEta(resolved.deliveryEtaMinutes);
      if (cityInputRef?.current && resolved.city) cityInputRef.current.value = resolved.city;
      if (houseInputRef?.current && resolved.house) houseInputRef.current.value = resolved.house;
    } else {
      setStatus("invalid");
      setEta(null);
    }
  }

  function selectSuggestion(s: Suggestion) {
    skipNextFetch.current = true;
    setQuery(s.subtitle ? `${s.label}, ${s.subtitle}` : s.label);
    setOpen(false);
    setSuggestions([]);
    // The suggest response already carries everything we need — no extra round trip.
    applyResolved({
      city: s.city,
      house: s.house,
      isValid: s.isHouseLevel,
      deliveryEtaMinutes: s.deliveryEtaMinutes,
    });
  }

  async function resolveTypedText(text: string) {
    setStatus("checking");
    try {
      const res = await fetch(`/api/address/resolve?text=${encodeURIComponent(text)}`);
      const data = await res.json();
      applyResolved({
        city: data.city ?? null,
        house: data.house ?? null,
        isValid: !!data.isValid,
        deliveryEtaMinutes: data.deliveryEtaMinutes ?? null,
      });
    } catch {
      setStatus("idle");
    }
  }

  function handleBlur() {
    // Give a click on a suggestion time to register before we run the fallback check.
    window.setTimeout(() => {
      setStatus((current) => {
        if (current === "idle" && query.trim().length >= 5) {
          resolveTypedText(query);
        }
        return current;
      });
    }, 150);
  }

  return (
    <div ref={containerRef} className="relative">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        name={name}
        required={required}
        autoComplete="off"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder="Улица, дом"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-char/15 bg-flatbread-2 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.uri ?? s.label}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className="block w-full px-4 py-2 text-left text-sm text-char hover:bg-ember/10"
              >
                <span className="font-medium">{s.label}</span>
                {s.subtitle && <span className="text-char/50"> {s.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {status === "checking" && <p className="mt-1.5 text-sm text-char/50">Проверяем адрес…</p>}
      {status === "valid" && (
        <p className="mt-1.5 text-sm font-medium text-herb">
          Адрес подтверждён
          {eta !== null ? ` · доставим примерно за ${eta} мин (включая 20 мин готовки)` : ""}
        </p>
      )}
      {status === "invalid" && (
        <FieldError>
          Не нашли такой адрес — проверьте улицу и номер дома или выберите вариант из списка
        </FieldError>
      )}
    </div>
  );
}
