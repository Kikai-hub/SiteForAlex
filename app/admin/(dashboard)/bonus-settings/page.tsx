import { getBonusSettings } from "@/lib/bonus";
import { BonusSettingsForm } from "@/components/admin/BonusSettingsForm";

export default async function BonusSettingsPage() {
  const settings = await getBonusSettings();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Бонусные баллы</h1>
      <p className="mt-1 text-sm text-char/60">
        Правила накопительной программы: сколько баллов клиент получает за заказ и сколько можно списать.
        Чтобы запретить списание баллов за конкретное блюдо — откройте карточку блюда в разделе «Меню».
      </p>
      <div className="mt-6">
        <BonusSettingsForm earnPercent={settings.earnPercent} maxRedeemPercent={settings.maxRedeemPercent} />
      </div>
    </div>
  );
}
