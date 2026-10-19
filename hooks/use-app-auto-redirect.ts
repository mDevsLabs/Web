"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { detectPlatform } from "@/lib/platform";

export type TargetAppKey = "coder" | "vibe" | "web";

/**
 * Résout l'application cible selon les paramètres d'URL,
 * les métadonnées de l'application de bureau (Electron) ou mobile (Capacitor).
 */
export function resolveTargetApp(): TargetAppKey | null {
  if (typeof window === "undefined") {
    return null;
  }

  // 1. Paramètre explicite dans l'URL (?app=coder, ?app=vibe, ?app=web)
  try {
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get("app")?.toLowerCase().trim();
    if (appParam === "coder" || appParam === "code") {
      return "coder";
    }
    if (appParam === "vibe") {
      return "vibe";
    }
    if (appParam === "web" || appParam === "mai") {
      return "web";
    }
  } catch {
    // Échec de lecture des query params silencieux
  }

  // 2. Propriété du bridge bureau Electron (window.maiDesktop.targetApp)
  if (window.maiDesktop) {
    const desktopTarget = (
      window.maiDesktop as { targetApp?: string }
    ).targetApp
      ?.toLowerCase()
      .trim();
    if (desktopTarget === "coder" || desktopTarget === "code") {
      return "coder";
    }
    if (desktopTarget === "vibe") {
      return "vibe";
    }
    if (desktopTarget === "web") {
      return "web";
    }
  }

  // 3. Détection de l'environnement mobile Capacitor
  const isCapacitor = Boolean(window.Capacitor?.isNativePlatform?.());
  if (isCapacitor) {
    if (window.location.hostname.includes("vibe")) {
      return "vibe";
    }
  }

  return null;
}

/**
 * Hook de redirection automatique des applications de bureau ou mobile :
 * - Coder redirige automatiquement vers son espace (/coder et openCoder natif sur desktop).
 * - Vibe redirige automatiquement vers son espace (/vibe).
 * - Web conserve le comportement classique sans forcer de navigation.
 */
export function useAppAutoRedirect(): void {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) {
      return;
    }

    const target = resolveTargetApp();
    const platform = detectPlatform();

    // Sur l'écran de connexion, forcer /coder créerait une boucle
    // /login → /coder → /login. On laisse l'utilisateur se connecter : le
    // prochain changement de route relancera la redirection.
    if (pathname === "/login" || pathname === "/register") {
      return;
    }

    if (target === "coder") {
      // Ne jamais lancer Coder depuis l'écran de connexion : sans cookie de
      // session, Coder retomberait sur un ancien compte local. On attend
      // d'être réellement sur /coder, dont l'accès est protégé par la session.
      const onCoderPage =
        pathname?.startsWith("/coder") || pathname?.startsWith("/code");
      if (!onCoderPage) {
        try {
          router.replace("/coder");
        } catch {
          window.location.replace("/coder");
        }
        return;
      }
      redirectedRef.current = true;
      if (
        platform === "electron" &&
        typeof window.maiDesktop?.openCoder === "function"
      ) {
        void window.maiDesktop.openCoder().then((result) => {
          if (!result?.success && result?.error) {
            console.warn("[mAI] ouverture de Coder refusée :", result.error);
          }
        });
      }
    } else if (target === "vibe") {
      redirectedRef.current = true;
      if (!pathname?.startsWith("/vibe")) {
        try {
          router.replace("/vibe");
        } catch {
          window.location.replace("/vibe");
        }
      }
    } else if (target === "web") {
      redirectedRef.current = true;
    }
  }, [pathname, router]);
}
