import { NextRequest, NextResponse } from "next/server";
import { suggestAddress } from "@/lib/yandex";
import { estimateDeliveryMinutes } from "@/lib/delivery";

/**
 * Fallback validation for addresses typed without picking a suggestion: re-runs the
 * same Geosuggest lookup on the raw text and checks whether the top match is a
 * house-level (real, buildable) address.
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text")?.trim();
  if (!text) {
    return NextResponse.json({ error: "Укажите text" }, { status: 400 });
  }

  try {
    const [top] = await suggestAddress(text);
    if (!top || !top.isHouseLevel) {
      return NextResponse.json({ isValid: false });
    }

    return NextResponse.json({
      isValid: true,
      city: top.city,
      street: top.street,
      house: top.house,
      deliveryEtaMinutes:
        top.distanceMeters !== null ? estimateDeliveryMinutes(top.distanceMeters / 1000) : null,
    });
  } catch {
    return NextResponse.json(
      { isValid: false, error: "Проверка адреса временно недоступна" },
      { status: 200 }
    );
  }
}
