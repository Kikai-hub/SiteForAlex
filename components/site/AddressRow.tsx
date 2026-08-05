"use client";

import { useTransition } from "react";
import { deleteAddress, setDefaultAddress } from "@/app/(site)/account/addresses/actions";

export function AddressRow({
  id,
  label,
  city,
  street,
  house,
  apartment,
  isDefault,
}: {
  id: string;
  label: string | null;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  isDefault: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-2xl bg-flatbread-2 p-4">
      <div>
        <p className="font-semibold text-char">
          {label ? `${label} · ` : ""}
          {city}, {street} {house}
          {apartment ? `, кв. ${apartment}` : ""}
        </p>
        {isDefault && <p className="text-xs font-semibold uppercase text-herb">Основной адрес</p>}
      </div>
      <div className="flex items-center gap-3">
        {!isDefault && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => setDefaultAddress(id))}
            className="text-sm font-medium text-ember hover:underline disabled:opacity-50"
          >
            Сделать основным
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteAddress(id))}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
