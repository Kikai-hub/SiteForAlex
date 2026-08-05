import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PromoCodeForm } from "@/components/admin/PromoCodeForm";
import { DeletePromoButton } from "@/components/admin/DeletePromoButton";

export default async function EditPromoCodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-char">{promo.code}</h1>
        <DeletePromoButton id={promo.id} code={promo.code} />
      </div>
      <div className="mt-6">
        <PromoCodeForm promo={promo} />
      </div>
    </div>
  );
}
