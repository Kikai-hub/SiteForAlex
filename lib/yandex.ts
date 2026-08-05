import { PICKUP_COORDS } from "@/lib/delivery";

const SUGGEST_URL = "https://suggest-maps.yandex.ru/v1/suggest";

/** How wide an area (lon,lat degrees) suggestions are biased toward, centered on PICKUP_COORDS. */
const SUGGEST_SPAN = "0.9,0.6";

function apiKey(): string {
  const key = process.env.YANDEX_MAPS_API_KEY;
  if (!key) throw new Error("YANDEX_MAPS_API_KEY is not configured");
  return key;
}

export interface AddressSuggestion {
  label: string;
  subtitle: string | null;
  uri: string | null;
  city: string | null;
  street: string | null;
  house: string | null;
  /** True when Yandex matched an actual building, not just a street or locality. */
  isHouseLevel: boolean;
  /** Straight-line distance from PICKUP_COORDS, in meters — Geosuggest computes this for free. */
  distanceMeters: number | null;
}

interface SuggestComponent {
  name: string;
  kind: string[];
}

interface SuggestResult {
  title?: { text?: string };
  subtitle?: { text?: string };
  tags?: string[];
  distance?: { value?: number };
  address?: { formatted_address?: string; component?: SuggestComponent[] };
  uri?: string;
}

function componentByKind(components: SuggestComponent[], kind: string): string | null {
  return components.find((c) => c.kind?.includes(kind))?.name ?? null;
}

function mapResult(item: SuggestResult): AddressSuggestion {
  const components = item.address?.component ?? [];
  return {
    label: item.title?.text ?? "",
    subtitle: item.subtitle?.text ?? null,
    uri: item.uri ?? null,
    city: componentByKind(components, "LOCALITY"),
    street: componentByKind(components, "STREET"),
    house: componentByKind(components, "HOUSE"),
    isHouseLevel: (item.tags ?? []).includes("house"),
    distanceMeters: item.distance?.value ?? null,
  };
}

export async function suggestAddress(text: string): Promise<AddressSuggestion[]> {
  const url = new URL(SUGGEST_URL);
  url.searchParams.set("apikey", apiKey());
  url.searchParams.set("text", text);
  url.searchParams.set("lang", "ru_RU");
  url.searchParams.set("results", "6");
  url.searchParams.set("print_address", "1");
  url.searchParams.set("attrs", "uri");
  url.searchParams.set("ll", `${PICKUP_COORDS.lon},${PICKUP_COORDS.lat}`);
  url.searchParams.set("spn", SUGGEST_SPAN);

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Yandex Geosuggest API error: ${res.status}`);
  const data = await res.json();

  const results: SuggestResult[] = Array.isArray(data?.results) ? data.results : [];
  return results.map(mapResult);
}
