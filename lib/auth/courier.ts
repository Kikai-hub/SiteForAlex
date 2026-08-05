import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/auth/session";

const isProd = process.env.NODE_ENV === "production";

export async function createCourierSession(courierId: string) {
  const token = await signSession("courier", courierId);
  const store = await cookies();
  store.set(SESSION_COOKIE.courier, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearCourierSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE.courier);
}

export async function getCourierSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE.courier)?.value;
  return verifySession(token, "courier");
}

export async function getCurrentCourier() {
  const session = await getCourierSession();
  if (!session) return null;
  return prisma.courier.findUnique({ where: { id: session.sub } });
}

export async function requireCourier() {
  const courier = await getCurrentCourier();
  if (!courier) throw new Error("UNAUTHENTICATED");
  return courier;
}
