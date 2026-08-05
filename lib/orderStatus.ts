export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтверждён",
  PREPARING: "Готовится",
  OUT_FOR_DELIVERY: "В пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, "ember" | "saffron" | "herb" | "neutral"> = {
  NEW: "ember",
  CONFIRMED: "saffron",
  PREPARING: "saffron",
  OUT_FOR_DELIVERY: "saffron",
  DELIVERED: "herb",
  CANCELLED: "neutral",
};
