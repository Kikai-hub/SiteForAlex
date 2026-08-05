import { redirect } from "next/navigation";
import { getCurrentCourier } from "@/lib/auth/courier";
import { CourierLogoutButton } from "@/components/courier/CourierLogoutButton";

export default async function CourierDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const courier = await getCurrentCourier();
  if (!courier) redirect("/courier/login");

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-char">{courier.name}</h1>
          <p className="text-sm text-char/50">Кабинет курьера · Adana Pizza</p>
        </div>
        <CourierLogoutButton />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
