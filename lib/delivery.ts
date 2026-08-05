/** Kitchen prep time baked into every delivery ETA, regardless of distance. */
export const COOKING_MINUTES = 20;

/** Address the courier departs from. */
export const PICKUP_ADDRESS = "Москва, Боровское шоссе, 27, корп. 1";

/** Coordinates of PICKUP_ADDRESS — used as the Geosuggest API bias point (`ll`), whose
 *  built-in `distance` field then doubles as the straight-line distance for ETA. */
export const PICKUP_COORDS: LatLng = { lat: 55.644247, lon: 37.366367 };

/** Average courier speed in city traffic, used for the straight-line estimate. */
const AVERAGE_COURIER_SPEED_KMH = 18;

/** Straight-line distance underestimates real streets, so scale it up. */
const ROAD_DISTANCE_FACTOR = 1.35;

export interface LatLng {
  lat: number;
  lon: number;
}

/** Estimated total delivery time (courier travel + kitchen prep), rounded to 5 min. */
export function estimateDeliveryMinutes(distanceKm: number): number {
  const roadKm = distanceKm * ROAD_DISTANCE_FACTOR;
  const travelMinutes = (roadKm / AVERAGE_COURIER_SPEED_KMH) * 60;
  const total = COOKING_MINUTES + travelMinutes;
  return Math.max(COOKING_MINUTES, Math.round(total / 5) * 5);
}
