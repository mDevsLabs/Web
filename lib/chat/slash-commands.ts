import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { SlashCommand } from "@/components/chat/slash-commands";
import { executeCustomCommand } from "@/lib/commands/exec";
import type { Agent, Skill } from "@/lib/db/schema";

// Contexte injecté par multimodal-input pour exécuter une commande slash.
export type SlashCommandContext = {
  router: {
    push: (url: string) => void;
  };
  chatId: string;
  setInput: Dispatch<SetStateAction<string>>;
  setMessages: (updater: (messages: any[]) => any[]) => void;
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
    setMessages,
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

  switch (cmd.action) {
    case "ghost": {
      toggleGhostMode();
      break;
    }
    case "new":
      router.push("/");
      break;
    case "clear":
      setMessages(() => []);
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
      router.push("/settings?tab=usage");
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
      router.push("/library");
      break;
    }
    case "projects": {
      router.push("/projects");
      break;
    }
    case "search": {
      // Dispatch global event for CommandDialog in sidebar, fallback to toast if listener absent
      window.dispatchEvent(new CustomEvent("open-search-dialog"));
      // Also try common selectors as fallback (focus sidebar search if exists)
      setTimeout(() => {
        const trigger = document.querySelector<HTMLButtonElement>(
          "[data-search-trigger]"
        );
        trigger?.click();
      }, 50);
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
      router.push("/planning");
      break;
    }
    case "notes": {
      router.push("/library");
      break;
    }
    case "home": {
      router.push("/");
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
    case "agents": {
      const agentBtn = document.querySelector<HTMLButtonElement>(
        "[data-testid='agent-selector']"
      );
      if (agentBtn) {
        agentBtn.click();
      } else {
        router.push("/agents");
      }
      break;
    }
    case "export": {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chats/${chatId}/export?format=md`
        );
        if (!res.ok) {
          throw new Error("Export échoué");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-${chatId}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Export Markdown téléchargé");
      } catch (e: any) {
        toast.error(e.message || "Erreur export");
      }
      break;
    }
    case "theme":
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      break;
    case "delete":
      toast("Delete this chat?", {
        action: {
          label: "Delete",
          onClick: () => {
            fetch(
              `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
              { method: "DELETE" }
            );
            router.push("/");
            toast.success("Chat deleted");
          },
        },
      });
      break;
    case "purge":
      toast("Delete all chats?", {
        action: {
          label: "Delete all",
          onClick: () => {
            fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
              method: "DELETE",
            });
            router.push("/");
            toast.success("All chats deleted");
          },
        },
      });
      break;
    default:
      break;
  }
}
