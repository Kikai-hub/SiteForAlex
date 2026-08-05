import { randomUUID } from "node:crypto";

const API_BASE = "https://api.yookassa.ru/v3";

export type YookassaPaymentStatus = "pending" | "waiting_for_capture" | "succeeded" | "canceled";

export interface YookassaPayment {
  id: string;
  status: YookassaPaymentStatus;
  paid: boolean;
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, unknown>;
}

export function isYookassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

function getCredentials(): { shopId: string; secretKey: string } {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    throw new Error("YooKassa is not configured — set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY.");
  }
  return { shopId, secretKey };
}

function authHeader(): string {
  const { shopId, secretKey } = getCredentials();
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

/** YooKassa expects a decimal string in major currency units, e.g. "199.00". */
function formatAmount(minor: number): string {
  return (minor / 100).toFixed(2);
}

export async function createYookassaPayment(params: {
  amountMinor: number;
  description: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}): Promise<YookassaPayment> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      // Required by YooKassa so a network-level retry of this exact request
      // can't create a second payment. Callers are responsible for not
      // calling this twice for what should be the same payment attempt —
      // see the existing-payment check in the create-payment route.
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: formatAmount(params.amountMinor), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: params.returnUrl },
      description: params.description,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YooKassa payment creation failed (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * Re-fetches a payment by id using our own API credentials. YooKassa webhook
 * notifications are not signed, so the status in a webhook POST body must
 * never be trusted directly — anyone who discovers the webhook URL could
 * forge a "succeeded" event. This is the source of truth instead.
 */
export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YooKassa payment lookup failed (${res.status}): ${body}`);
  }
  return res.json();
}
