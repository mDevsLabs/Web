import { type NextRequest, NextResponse } from "next/server";
import { MAI_SESSION_COOKIE } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Routes publiques autorisées
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isStaticRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.png") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico");

  if (isStaticRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(MAI_SESSION_COOKIE)?.value;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // 1. Utilisateur non authentifié tentant d'accéder à une route privée
  if (!token) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    const redirectUrl = encodeURIComponent(new URL(request.url).pathname);
    return NextResponse.redirect(
      new URL(`${base}/login?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  // 2. Utilisateur déjà authentifié tentant d'aller sur /login ou /register
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL(`${base}/`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id*",
    "/settings",
    "/library",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
