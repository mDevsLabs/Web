import { type NextRequest, NextResponse } from "next/server";
import { API_ERROR_STATUS } from "./lib/api/error-codes";
import { DEFAULT_MESSAGES_FR } from "./lib/api/error-messages";
import { isLiveSessionToken } from "./lib/auth/token-liveness";
import { MAI_SESSION_COOKIE } from "./lib/constants";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // BotID (Vercel) : le script de vérification du SDK client est servi sous ce
  // préfixe fixe via les rewrites `beforeFiles` de withBotId. Le middleware
  // s'exécutant AVANT les rewrites, toute interception ici (redirect /login)
  // casse le chargement du script et fait rejeter les Server Actions protégées
  // (POST /login, /register) avant même l'appel à l'API.
  const BOTID_PREFIX = "/149e9513-01fa-4fb0-aad4-566afd725d1b/";
  if (
    pathname.startsWith(BOTID_PREFIX) ||
    pathname.startsWith(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${BOTID_PREFIX}`
    )
  ) {
    return NextResponse.next();
  }

  if (pathname === "/changelog") {
    return NextResponse.next();
  }

  // Le site officiel et portail vitrine (/site) est public par défaut.
  // Seul l'espace de gestion de compte (/site/account) exige une authentification.
  if (
    pathname === "/site" ||
    (pathname.startsWith("/site/") && !pathname.startsWith("/site/account"))
  ) {
    return NextResponse.next();
  }

  // Rapports de violation CSP. La route est publique par nature — un rapport
  // arrive souvent après une redirection ou une expiration de session, et il ne
  // contient aucune donnée de l'utilisateur. La lui refuser produirait des
  // rapports muets, donc un mode d'observation qui n'observe rien.
  if (pathname.startsWith("/api/security/csp-report")) {
    return NextResponse.next();
  }

  // Routes publiques autorisées
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  // Bypass strictement limité aux assets statiques réels.
  // (La garde `!pathname.startsWith("/api/")` empêche tout contournement d'API
  // via une extension d'image fictive).
  const isStaticAsset =
    !pathname.startsWith("/api/") &&
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|mp4|webm|woff2?|ttf|eot)$/i.test(
      pathname
    );

  const isStaticRoute =
    isStaticAsset ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.png" ||
    pathname === "/logo.png" ||
    pathname === "/preview.png" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/mcp/") ||
    pathname.startsWith("/coder/") ||
    pathname.startsWith("/demo-assets/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt";

  if (isStaticRoute) {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get(MAI_SESSION_COOKIE)?.value;
  // La PRÉSENCE du cookie ne suffit pas : un jeton expiré n'est pas une
  // session. Le traiter comme absent rend /login accessible et fait répondre
  // 401 les API, au lieu de laisser entrer dans une application où plus rien
  // ne fonctionne et d'où l'on ne peut pas sortir.
  const token = isLiveSessionToken(rawToken) ? rawToken : null;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const isApiRoute = pathname.startsWith("/api/");

  // 1. Utilisateur non authentifié tentant d'accéder à une route privée
  if (!token) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    // Les API doivent répondre 401 JSON (enveloppe d'erreur unifiée), pas un
    // redirect HTML
    if (isApiRoute) {
      return NextResponse.json(
        {
          code: "auth_required",
          message: DEFAULT_MESSAGES_FR.auth_required,
          status: API_ERROR_STATUS.auth_required,
        },
        { status: API_ERROR_STATUS.auth_required }
      );
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
