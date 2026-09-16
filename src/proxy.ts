import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const PROTECTED = [
  "/chat",
  "/knowledge",
  "/tutor",
  "/skills",
  "/research",
  "/memory",
  "/settings",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (!needsAuth) return NextResponse.next();
  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/knowledge/:path*",
    "/tutor/:path*",
    "/skills/:path*",
    "/research/:path*",
    "/memory/:path*",
    "/settings/:path*",
  ],
};
