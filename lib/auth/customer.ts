import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/auth/session";

const isProd = process.env.NODE_ENV === "production";

export async function createCustomerSession(customerId: string) {
  const token = await signSession("customer", customerId);
  const store = await cookies();
  store.set(SESSION_COOKIE.customer, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE.customer);
}

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE.customer)?.value;
  return verifySession(token, "customer");
}

/** Loads the current customer from the DB, or null if not logged in / account was removed. */
export async function getCurrentCustomer() {
  const session = await getCustomerSession();
  if (!session) return null;
  return prisma.customer.findUnique({ where: { id: session.sub } });
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("UNAUTHENTICATED");
  return customer;
}
