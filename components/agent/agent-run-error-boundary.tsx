"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

// Frontière d'erreur localisée à la zone d'exécution d'un run.
//
// `app/(chat)/error.tsx` ne protège que le segment : une exception de rendu
// n'importe où dans l'arbre Agent le remplace par une page « Réessayer /
// Accueil », ce qui jette la conversation, le composer et l'historique pour un
// défaut d'affichage de la seule timeline. Or la timeline est la zone la plus
// exposée : elle rend des icônes choisies par clé, des listes et un dialogue.
//
// Cette frontière contient le dommage : si la timeline ne sait pas se rendre,
// l'utilisateur garde sa conversation et peut continuer à écrire, et l'erreur
// est journalisée avec son contexte plutôt que perdue.

type Props = {
  children: ReactNode;
  /** Identifiant du run, pour relier l'erreur aux logs serveur. */
  runId?: string | null;
};

type State = {
  error: Error | null;
};

export class AgentRunErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `[mAI] Affichage de l'exécution Agent indisponible${this.props.runId ? ` (run ${this.props.runId})` : ""}:`,
      error,
      info.componentStack
    );
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <div
        className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-900 dark:text-amber-200"
        role="status"
      >
        <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Le détail de l&apos;exécution n&apos;est pas affichable, mais la
          conversation reste utilisable : la réponse et l&apos;historique
          fonctionnent normalement.
        </span>
      </div>
    );
  }
}
