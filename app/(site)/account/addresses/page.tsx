import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/customer";
import { AddressCreateForm } from "@/components/site/AddressCreateForm";
import { AddressRow } from "@/components/site/AddressRow";

export default async function AddressesPage() {
  const customer = await requireCustomer();
  const addresses = await prisma.address.findMany({
    where: { customerId: customer.id },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {addresses.map((a) => (
          <AddressRow
            key={a.id}
            id={a.id}
            label={a.label}
            city={a.city}
            street={a.street}
            house={a.house}
            apartment={a.apartment}
            isDefault={a.isDefault}
          />
        ))}
        {addresses.length === 0 && (
          <p className="text-char/50">Пока нет сохранённых адресов.</p>
        )}
      </div>
      <AddressCreateForm />
    </div>
  );
}
