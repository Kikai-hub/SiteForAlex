import { NextResponse } from "next/server";
import { clearCourierSession } from "@/lib/auth/courier";

export async function POST() {
  await clearCourierSession();
  return NextResponse.json({ ok: true });
}
