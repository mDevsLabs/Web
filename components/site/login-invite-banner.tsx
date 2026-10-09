"use client";

import { XIcon } from "@mdevs/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Bandeau d'invitation à la connexion du site (/site), affiché après une
// déconnexion de l'application (redirection vers /site?connexion=1).
//
// La fermeture est mémorisée par session : l'utilisateur qui a vu le message
// et navigue dans le site ne doit pas voir le bandeau revenir à chaque page.
// `sessionStorage` et non le state local : le composant est monté par le
// layout, donc survit à la navigation interne du site via le routeur client.

const DISMISS_KEY = "mai.site.login-invite-dismissed";

export function LoginInviteBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams.get("connexion") !== "1") {
      return;
    }
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        return;
      }
    } catch {
      // Stockage indisponible : on affiche, c'est le choix le moins mauvais.
    }
    setVisible(true);
  }, [searchParams]);

  if (!mounted || !visible) {
    return null;
  }

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Le bandeau disparaît pour cette page seulement.
    }
  };

  return (
    <div
      aria-live="polite"
      className="mx-auto mt-4 w-full max-w-6xl xl:max-w-7xl"
      role="status"
    >
      <div className="surface-muted flex flex-col gap-3 rounded-2xl border-border/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            Vous êtes déconnecté
          </span>
          <span className="text-xs leading-snug text-muted-foreground">
            Connectez-vous pour retrouver vos conversations, vos projets et vos
            outils IA.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
            href="/login"
          >
            Se connecter
          </Link>
          <button
            aria-label="Fermer le message"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            onClick={dismiss}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
