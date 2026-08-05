import { SignJWT, jwtVerify } from "jose";

export type SessionRole = "customer" | "admin";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
  [key: string]: unknown;
}

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me"
);

export const SESSION_COOKIE = {
  customer: "customer_session",
  admin: "admin_session",
} as const;

const EXPIRY = {
  customer: "30d",
  admin: "12h",
} as const;

export async function signSession(role: SessionRole, subjectId: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subjectId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY[role])
    .sign(secret);
}

export async function verifySession(
  token: string | undefined,
  expectedRole: SessionRole
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== expectedRole || typeof payload.sub !== "string") {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
