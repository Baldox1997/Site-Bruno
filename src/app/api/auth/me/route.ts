import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, email: session.email, role: session.role });
}
