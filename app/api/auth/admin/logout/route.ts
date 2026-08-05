import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth/admin";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
