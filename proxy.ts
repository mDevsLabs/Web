import { type NextRequest, NextResponse } from "next/server";
import { MAI_SESSION_COOKIE } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Routes publiques autorisées
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  // Bypass strictement limité aux assets statiques réels.
  // (Ne plus utiliser pathname.endsWith(".png"/".svg"/".ico") : cela
  // permettait de contourner l'auth via /api/.../*.svg)
  const isStaticRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/logo.png" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/demo-assets/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt";

  if (isStaticRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(MAI_SESSION_COOKIE)?.value;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const isApiRoute = pathname.startsWith("/api/");

  // 1. Utilisateur non authentifié tentant d'accéder à une route privée
  if (!token) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    // Les API doivent répondre 401 JSON, pas un redirect HTML
    if (isApiRoute) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    // Conserve le chemin + la query pour retour après login
    const nextUrl = request.nextUrl.clone();
    const redirectTarget = `${nextUrl.pathname}${nextUrl.search}`;
    return NextResponse.redirect(
      new URL(
        `${base}/login?redirectUrl=${encodeURIComponent(redirectTarget)}`,
        request.url
      )
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
