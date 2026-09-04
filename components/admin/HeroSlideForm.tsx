"use client";

import { useActionState } from "react";
import { createHeroSlide, updateHeroSlide, type ActionState } from "@/app/admin/(dashboard)/slides/actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function HeroSlideForm({
  slide,
  dishes,
}: {
  slide?: {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    badgeText: string | null;
    priceLabel: string | null;
    ctaLabel: string;
    ctaHref: string | null;
    dishId: string | null;
    sortOrder: number;
    isActive: boolean;
  };
  dishes: { id: string; name: string }[];
}) {
  const action = slide ? updateHeroSlide.bind(null, slide.id) : createHeroSlide;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-2xl bg-flatbread-2 p-6">
      <div>
        <Label htmlFor="title">Заголовок</Label>
        <Input id="title" name="title" required defaultValue={slide?.title} placeholder="Комбо «Двойной пепперони»" />
      </div>
      <div>
        <Label htmlFor="subtitle">Подзаголовок (необязательно)</Label>
        <Input id="subtitle" name="subtitle" defaultValue={slide?.subtitle ?? ""} placeholder="2 пиццы + напиток" />
      </div>
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={slide?.description ?? ""}
          placeholder="Короткое описание акции для баннера"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-56">
          <Label htmlFor="badgeText">Метка над заголовком</Label>
          <Input id="badgeText" name="badgeText" defaultValue={slide?.badgeText ?? ""} placeholder="Акция недели" />
        </div>
        <div className="w-40">
          <Label htmlFor="priceLabel">Цена на баннере</Label>
          <Input id="priceLabel" name="priceLabel" defaultValue={slide?.priceLabel ?? ""} placeholder="от 585 ₽" />
        </div>
      </div>

      <div>
        <Label htmlFor="dishId">Связать с блюдом/сетом (необязательно)</Label>
        <Select id="dishId" name="dishId" defaultValue={slide?.dishId ?? ""}>
          <option value="">Без привязки — свободный баннер</option>
          {dishes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-xs text-char/50">
          Если выбрано блюдо, кнопка ведёт на его страницу, а цена подставляется автоматически, если поле «Цена на баннере» пустое.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1">
          <Label htmlFor="ctaLabel">Текст кнопки</Label>
          <Input id="ctaLabel" name="ctaLabel" required defaultValue={slide?.ctaLabel ?? "Подробнее"} />
        </div>
        <div className="flex-1">
          <Label htmlFor="ctaHref">Ссылка кнопки (необязательно)</Label>
          <Input id="ctaHref" name="ctaHref" defaultValue={slide?.ctaHref ?? ""} placeholder="/menu" />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-32">
          <Label htmlFor="sortOrder">Порядок</Label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={slide?.sortOrder ?? 0} />
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-char/70">
          <input type="checkbox" name="isActive" defaultChecked={slide?.isActive ?? true} className="h-4 w-4 accent-ember" />
          Показывать на главной
        </label>
      </div>

      <FieldError>{state.error}</FieldError>
      <Button type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : slide ? "Сохранить" : "Создать слайд"}
      </Button>
    </form>
  );
}
