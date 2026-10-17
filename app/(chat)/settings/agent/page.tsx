"use client";

// La page Agent a été absorbée dans les paramètres globaux (onglet « Agent »
// de /settings). Pourquoi une redirection plutôt qu'une suppression : des
// liens et raccourcis pointent encore vers /settings/agent (accueil Agent,
// onboarding) — les casser rendrait ces chemins muets. `?view=activity` et
// `?view=history`, gérés par l'ancienne page, sont mappés sur les ancres de
// l'onglet.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AgentSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    const anchor =
      view === "activity"
        ? "#agent-activity"
        : view === "history"
          ? "#agent-availability"
          : "";
    router.replace(`/settings?tab=agent${anchor}`);
  }, [router]);

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <span className="text-sm">
        Les paramètres Agent ont déménagé — redirection vers les paramètres…
      </span>
    </div>
  );
}
