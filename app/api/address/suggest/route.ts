import { NextRequest, NextResponse } from "next/server";
import { suggestAddress } from "@/lib/yandex";
import { estimateDeliveryMinutes } from "@/lib/delivery";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text")?.trim() ?? "";
  if (text.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const results = await suggestAddress(text);
    const suggestions = results.map((s) => ({
      ...s,
      deliveryEtaMinutes:
        s.isHouseLevel && s.distanceMeters !== null
          ? estimateDeliveryMinutes(s.distanceMeters / 1000)
          : null,
    }));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [], error: "Подсказки адреса временно недоступны" });
  }
}
