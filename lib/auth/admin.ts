import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/auth/session";

const isProd = process.env.NODE_ENV === "production";

export async function createAdminSession(adminId: string) {
  const token = await signSession("admin", adminId);
  const store = await cookies();
  store.set(SESSION_COOKIE.admin, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE.admin);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE.admin)?.value;
  return verifySession(token, "admin");
}

export async function getCurrentAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return prisma.adminUser.findUnique({ where: { id: session.sub } });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("UNAUTHENTICATED");
  return admin;
}
