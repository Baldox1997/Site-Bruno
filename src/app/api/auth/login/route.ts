import { NextResponse } from "next/server";
import { COOKIE, MAX_AGE, createSession, getAdminEmail, verifyAdminPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha obrigatórios" }, { status: 400 });
    }
    if (email.toLowerCase() !== getAdminEmail().toLowerCase()) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = await createSession(email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
