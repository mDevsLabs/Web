import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { SlashCommand } from "@/components/chat/slash-commands";
import { downloadChatAsMarkdown } from "@/lib/chat/export-markdown";
import { pagePath } from "@/lib/client/api-endpoints";
import { executeCustomCommand } from "@/lib/commands/exec";
import type { Agent, Skill } from "@/lib/db/schema";

// Contexte injecté par multimodal-input pour exécuter une commande slash.
export type SlashCommandContext = {
  router: {
    push: (url: string) => void;
  };
  chatId: string;
  setInput: Dispatch<SetStateAction<string>>;
  /** Invalide le cache de l'historique après une suppression. */
  invalidateHistory: () => unknown;
  /**
   * Vide la conversation ET son état transitoire (flux, outils en attente,
   * artefact). `setMessages(() => [])` ne le fait pas : le flux continuait
   * d'alimenter le dernier message et `/api/chat` continuait de consommer
   * des tokens.
   */
  resetChat: () => void;
  /**
   * Interrompt le flux en cours. Appelé par toute commande qui quitte ou vide
   * la conversation : sans cela, `/clear` coupait l'affichage mais laissait la
   * requête facturer jusqu'à son terme.
   */
  stopStream: () => void;
  pendingTools: readonly unknown[];
  togglePendingTool: (toolId: any) => void;
  clearPendingTools: () => void;
  toggleGhostMode: () => void;
  isGhostMode: boolean;
  userAgents: Agent[];
  userSkills: Skill[];
  setActiveAgent: (agent: any) => void;
  setActiveSkill: (skill: any) => void;
  setPendingCommand: (command: any) => void;
  setTheme: (theme: string) => void;
  resolvedTheme: string | undefined;
  onOpenQuizConfig: () => void;
};

const customCommandToast = (opts: {
  type?: string;
  description?: string;
}): void => {
  if (opts.type === "error") {
    toast.error(opts.description);
  } else {
    toast.success(opts.description);
  }
};

/** Commandes qui quittent la conversation : le flux doit être coupé d'abord. */
const CONVERSATION_LEAVING_ACTIONS = new Set([
  "clear",
  "delete",
  "home",
  "new",
  "purge",
]);

/** Message d'erreur générique, une seule formulation pour toutes les routes. */
async function failFetch(response: Response, fallback: string): Promise<never> {
  const data = await response.json().catch(() => ({}));
  const message =
    (data && typeof data === "object" && "error" in data
      ? String((data as { error?: unknown }).error ?? "")
      : "") || fallback;
  throw new Error(message);
}

// Interpréteur des commandes slash système (les commandes personnalisées
// sont déléguées à executeCustomCommand).
export async function runSlashCommand(
  cmd: SlashCommand,
  ctx: SlashCommandContext
): Promise<void> {
  const {
    router,
    chatId,
    setInput,
    invalidateHistory,
    resetChat,
    stopStream,
    pendingTools,
    togglePendingTool,
    clearPendingTools,
    toggleGhostMode,
    isGhostMode,
    userAgents,
    userSkills,
    setActiveAgent,
    setActiveSkill,
    setPendingCommand,
    setTheme,
    resolvedTheme,
    onOpenQuizConfig,
  } = ctx;

  if (cmd.action === "custom" && cmd.custom) {
    executeCustomCommand(cmd.custom, {
      agents: userAgents,
      router: router as any,
      setActiveAgent: setActiveAgent as any,
      setActiveSkill: setActiveSkill as any,
      setPendingCommand,
      skills: userSkills,
      toast: customCommandToast,
      togglePendingTool: togglePendingTool as any,
    });
    return;
  }

  // Toute commande système annule la commande personnalisée en attente.
  // Sans cela, `/mon-prompt` puis `/image` laissait le prompt injecté dans le
  // system prompt du message suivant, sans que rien ne l'indique.
  if (cmd.action !== "custom") {
    setPendingCommand(null);
  }

  // Le flux est arrêté AVANT l'effet : `/clear` vidait l'affichage pendant que
  // le SDK continuait d'almenter le message et que la requête continuait de
  // facturer des tokens.
  if (CONVERSATION_LEAVING_ACTIONS.has(cmd.action)) {
    stopStream();
  }

  switch (cmd.action) {
    case "ghost": {
      toggleGhostMode();
      break;
    }
    case "new":
      router.push(pagePath("/"));
      break;
    case "clear":
      // `resetChat` et non `setMessages(() => [])` : la commande est déclarée
      // comme `{ kind: "reset" }` par lib/chat/slash-command-outcomes, et
      // l'Agent l'exécute déjà ainsi. Les deux modes doivent se comporter
      // pareil, sinon « /clear » veut dire deux choses selon l'écran.
      resetChat();
      break;
    case "rename":
      toast.info(
        "Le renommage est disponible depuis le menu de la discussion."
      );
      break;
    case "model": {
      const modelBtn = document.querySelector<HTMLButtonElement>(
        "[data-testid='model-selector']"
      );
      modelBtn?.click();
      break;
    }
    case "usage": {
      router.push(pagePath("/settings?tab=usage"));
      // try scroll after navigation
      setTimeout(() => {
        const el =
          document.getElementById("usage-mAI") ||
          document.getElementById("usage");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
      break;
    }
    case "library": {
      router.push(pagePath("/library"));
      break;
    }
    case "projects": {
      router.push(pagePath("/projects"));
      break;
    }
    case "search": {
      // Un seul dispatch : l'eventListener de `SearchDialog` ouvre la boîte de
      // recherche rapide. Le bouton `[data-search-trigger]` de la barre latérale
      // a disparu au profit de l'icône qui ouvre la page de recherche globale
      // — `/search` reste donc, lui, la voie VERS LA MODALE.
      window.dispatchEvent(new CustomEvent("open-search-dialog"));
      break;
    }
    case "tasks": {
      // Le Chat ne dispose pas de l'outil « tâches » : l'Agent le provisionne
      // lui-même dans sa boucle. Le menu annonçait « /taches » sans jamais
      // rien produire, ce qui est pire qu'une absence.
      toast.info(
        "La gestion des tâches se fait dans l'onglet Planification, ou par l'Agent en mode Agent."
      );
      router.push(pagePath("/planning"));
      break;
    }
    case "tool-image": {
      if (isGhostMode) {
        toast.error("La génération d'image est indisponible en Mode fantôme");
        break;
      }
      togglePendingTool("imageGenerate" as any);
      toast.success(
        "Outil imageGenerate activé pour le prochain message — fortement recommandé"
      );
      break;
    }
    case "tool-audio": {
      if (isGhostMode) {
        toast.error("La génération audio est indisponible en Mode fantôme");
        break;
      }
      togglePendingTool("audioGenerate" as any);
      toast.success(
        "Outil audioGenerate activé pour le prochain message — fortement recommandé"
      );
      break;
    }
    case "tool-web": {
      togglePendingTool("webSearch" as any);
      toast.success("Outil Recherche Web activé pour le prochain message");
      break;
    }
    case "tool-code": {
      togglePendingTool("codeExecution" as any);
      toast.success(
        "Outil codeExecution activé pour le prochain message — fortement recommandé"
      );
      break;
    }
    case "tool-weather": {
      togglePendingTool("getWeather" as any);
      toast.success("Outil Météo activé pour le prochain message");
      break;
    }
    case "tool-doc": {
      // toggle all doc tools as a group
      const docTools: any[] = [
        "createDocument",
        "editDocument",
        "updateDocument",
      ];
      const hasAny = docTools.some((t) => pendingTools.includes(t as any));
      if (hasAny) {
        docTools.forEach((t) => {
          if (pendingTools.includes(t as any)) {
            togglePendingTool(t as any);
          }
        });
        toast.success("Outils documents désactivés");
      } else {
        docTools.forEach((t) => togglePendingTool(t as any));
        toast.success(
          "Outils documents activés pour le prochain message — fortement recommandés"
        );
      }
      break;
    }
    case "tool-suggest": {
      togglePendingTool("requestSuggestions" as any);
      toast.success("Outil suggestions activé pour le prochain message");
      break;
    }
    case "tool-calc": {
      togglePendingTool("calculator" as any);
      toast.success(
        "Outil Calculatrice + conversions activé pour le prochain message"
      );
      break;
    }
    case "tool-time": {
      togglePendingTool("dateTime" as any);
      toast.success(
        "Outil Date & heure (fuseaux horaires) activé pour le prochain message"
      );
      break;
    }
    case "tool-note": {
      togglePendingTool("note" as any);
      toast.success(
        "Outil Note (téléchargeable) activé pour le prochain message"
      );
      break;
    }
    case "planning": {
      router.push(pagePath("/planning"));
      break;
    }
    case "home": {
      router.push(pagePath("/"));
      break;
    }
    case "tool-chart": {
      togglePendingTool("generateChart" as any);
      toast.success("Outil Graphique activé pour le prochain message");
      break;
    }
    case "tool-memory": {
      togglePendingTool("memory" as any);
      toast.success("Outil Mémoire activé pour le prochain message");
      break;
    }
    case "tool-qr": {
      togglePendingTool("qrCodeGenerator" as any);
      toast.success("Outil QR Code activé pour le prochain message");
      break;
    }
    case "tool-summary": {
      setInput(
        "Fais-moi un résumé clair et structuré par sections de notre échange."
      );
      break;
    }
    case "quiz": {
      onOpenQuizConfig();
      break;
    }
    case "tools-clear": {
      clearPendingTools();
      toast.success("Tous les outils désactivés");
      break;
    }
    case "bots": {
      // Le sélecteur de bots est monté par le composer Chat. S'il est absent
      // (compte Free, sélecteur masqué), on ne laisse pas la commande sans
      // effet : la page /agents au moins explique ce que sont les bots.
      const botBtn = document.querySelector<HTMLButtonElement>(
        "[data-testid='agent-selector']"
      );
      if (botBtn) {
        botBtn.click();
      } else {
        router.push(pagePath("/agents"));
      }
      break;
    }
    case "export": {
      // Le booléen de retour était ignoré : un export échoué ne disait rien.
      const ok = await downloadChatAsMarkdown(chatId);
      if (!ok) {
        toast.error("L'export de la conversation a échoué.");
      }
      break;
    }
    case "theme":
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      break;
    case "delete":
      toast("Supprimer cette discussion ?", {
        action: {
          label: "Supprimer",
          onClick: async () => {
            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                { method: "DELETE" }
              );
              if (!res.ok) {
                await failFetch(res, "La suppression a échoué.");
              }
              await invalidateHistory();
              resetChat();
              router.push(pagePath("/"));
              toast.success("Discussion supprimée");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "La suppression a échoué."
              );
            }
          },
        },
      });
      break;
    case "purge":
      toast("Supprimer toutes les discussions ?", {
        action: {
          label: "Tout supprimer",
          onClick: async () => {
            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
                { method: "DELETE" }
              );
              if (!res.ok) {
                await failFetch(res, "La suppression a échoué.");
              }
              await invalidateHistory();
              resetChat();
              router.push(pagePath("/"));
              toast.success("Toutes les discussions ont été supprimées");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "La suppression a échoué."
              );
            }
          },
        },
      });
      break;
    default:
      // Un `break` muet faisait croire à un bug : l'interface vidait l'input,
      // la commande disparaissait du champ, et rien ne se passait. Une action
      // ajoutée à l'union sans être traitée se voit maintenant, et le test
      // slash-command-invariants échoue sur la même omission.
      toast.info(`« /${cmd.name} » n'est pas pris en charge.`);
  }
}
