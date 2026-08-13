import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
