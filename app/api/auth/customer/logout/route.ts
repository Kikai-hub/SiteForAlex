import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/auth/customer";

export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ ok: true });
}
