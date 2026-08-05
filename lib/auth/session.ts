import { SignJWT, jwtVerify } from "jose";

export type SessionRole = "customer" | "admin" | "courier";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
  [key: string]: unknown;
}

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set in production — refusing to sign sessions with the dev fallback secret."
    );
  }

  cachedSecret = new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me"
  );
  return cachedSecret;
}

export const SESSION_COOKIE = {
  customer: "customer_session",
  admin: "admin_session",
  courier: "courier_session",
} as const;

const EXPIRY = {
  customer: "30d",
  admin: "12h",
  courier: "12h",
} as const;

export async function signSession(role: SessionRole, subjectId: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subjectId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY[role])
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
  expectedRole: SessionRole
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== expectedRole || typeof payload.sub !== "string") {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
