import { PromoCodeForm } from "@/components/admin/PromoCodeForm";

export default function NewPromoCodePage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Новый промокод</h1>
      <div className="mt-6">
        <PromoCodeForm />
      </div>
    </div>
  );
}
