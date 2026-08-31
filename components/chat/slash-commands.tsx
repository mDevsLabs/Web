"use client";

import {
  BombIcon,
  BotIcon,
  CalculatorIcon,
  CalendarIcon,
  CloudSunIcon,
  Code2Icon,
  DownloadIcon,
  FileTextIcon,
  FolderArchiveIcon,
  FolderKanbanIcon,
  GhostIcon,
  GlobeIcon,
  ImageIcon,
  LightbulbIcon,
  ListIcon,
  NotebookIcon,
  PaletteIcon,
  PenLineIcon,
  PenSquareIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  Volume2Icon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type SlashCommandAction =
  | "new"
  | "clear"
  | "ghost"
  | "rename"
  | "model"
  | "agents"
  | "export"
  | "theme"
  | "delete"
  | "purge"
  | "usage"
  | "library"
  | "projects"
  | "search"
  | "tool-image"
  | "tool-audio"
  | "tool-web"
  | "tool-code"
  | "tool-weather"
  | "tool-doc"
  | "tool-suggest"
  | "tool-calc"
  | "tool-time"
  | "tool-note"
  | "tools-clear";

export type SlashCommand = {
  name: string;
  description: string;
  icon: ReactNode;
  action: SlashCommandAction;
  shortcut?: string;
  aliases?: string[];
};

export const slashCommands: SlashCommand[] = [
  {
    action: "ghost",
    aliases: ["fantome", "incognito", "temporary", "temp"],
    description:
      "Activer / désactiver le Mode fantôme (temporaire, non sauvegardé, sans image)",
    icon: <GhostIcon className="size-3.5" />,
    name: "ghost",
  },
  {
    action: "new",
    description: "Start a new chat",
    icon: <PenSquareIcon className="size-3.5" />,
    name: "new",
  },
  {
    action: "clear",
    description: "Clear current chat",
    icon: <Trash2Icon className="size-3.5" />,
    name: "clear",
  },
  {
    action: "rename",
    description: "Rename current chat",
    icon: <PenLineIcon className="size-3.5" />,
    name: "rename",
  },
  {
    action: "model",
    description: "Ouvre le sélecteur de modèles",
    icon: <ListIcon className="size-3.5" />,
    name: "model",
  },
  {
    action: "agents",
    aliases: ["agent", "agents", "ia-agents"],
    description: "Ouvrir le menu de choix des agents",
    icon: <BotIcon className="size-3.5" />,
    name: "agents",
  },
  {
    action: "export",
    aliases: ["exporter", "download", "telecharger"],
    description: "Exporter la conversation en cours (Markdown)",
    icon: <DownloadIcon className="size-3.5" />,
    name: "export",
  },
  {
    action: "usage",
    description: "Paramètres → Consommation (Usage mAI)",
    icon: <ZapIcon className="size-3.5" />,
    name: "usage",
  },
  {
    action: "library",
    aliases: ["stockage"],
    description: "Ouvrir le Stockage (/stockage, /library)",
    icon: <FolderArchiveIcon className="size-3.5" />,
    name: "library",
  },
  {
    action: "projects",
    description: "Ouvrir la page Projets",
    icon: <FolderKanbanIcon className="size-3.5" />,
    name: "projects",
  },
  {
    action: "search",
    aliases: ["recherche", "find"],
    description: "Rechercher dans conversations / projets / fichiers",
    icon: <SearchIcon className="size-3.5" />,
    name: "search",
  },
  {
    action: "tool-image",
    aliases: ["image", "images", "generate"],
    description: "Activer génération d'image (one-shot, fortement recommandé)",
    icon: <ImageIcon className="size-3.5" />,
    name: "image",
  },
  {
    action: "tool-audio",
    aliases: ["audio", "son", "voice", "speech", "tts", "voix"],
    description:
      "Activer génération audio & voix (one-shot, fortement recommandé)",
    icon: <Volume2Icon className="size-3.5" />,
    name: "audio",
  },
  {
    action: "tool-web",
    aliases: ["web", "recherche-web", "search-web"],
    description: "Activer recherche Web en temps réel (one-shot)",
    icon: <GlobeIcon className="size-3.5" />,
    name: "web",
  },
  {
    action: "tool-code",
    aliases: ["code", "execute", "run"],
    description: "Activer exécution de code Pyodide (one-shot)",
    icon: <Code2Icon className="size-3.5" />,
    name: "code",
  },
  {
    action: "tool-weather",
    aliases: ["weather", "meteo"],
    description: "Activer outil météo (one-shot)",
    icon: <CloudSunIcon className="size-3.5" />,
    name: "weather",
  },
  {
    action: "tool-doc",
    aliases: ["doc", "document"],
    description: "Activer création/édition de documents (one-shot)",
    icon: <FileTextIcon className="size-3.5" />,
    name: "doc",
  },
  {
    action: "tool-suggest",
    aliases: ["suggest", "suggestion"],
    description: "Activer suggestions d'amélioration (one-shot)",
    icon: <LightbulbIcon className="size-3.5" />,
    name: "suggest",
  },
  {
    action: "tool-calc",
    aliases: ["calc", "calcul", "calculatrice", "convert", "conversion"],
    description:
      "Activer calculatrice et conversions d'unités (longueur, masse, température, etc.)",
    icon: <CalculatorIcon className="size-3.5" />,
    name: "calc",
  },
  {
    action: "tool-time",
    aliases: ["time", "date", "heure", "horloge", "fuseau", "timezone"],
    description:
      "Activer date/heure, fuseaux horaires, calculs sur dates (one-shot)",
    icon: <CalendarIcon className="size-3.5" />,
    name: "time",
  },
  {
    action: "tool-note",
    aliases: ["note", "notes", "memo", "mémo"],
    description: "Activer création de note téléchargeable (one-shot)",
    icon: <NotebookIcon className="size-3.5" />,
    name: "note",
  },
  {
    action: "tools-clear",
    aliases: ["tools-off", "clear-tools"],
    description: "Désactiver tous les outils",
    icon: <SlidersHorizontalIcon className="size-3.5" />,
    name: "tools-clear",
  },
  {
    action: "theme",
    description: "Toggle dark/light mode",
    icon: <PaletteIcon className="size-3.5" />,
    name: "theme",
  },
  {
    action: "delete",
    description: "Delete current chat",
    icon: <XIcon className="size-3.5" />,
    name: "delete",
  },
  {
    action: "purge",
    description: "Delete all chats",
    icon: <BombIcon className="size-3.5" />,
    name: "purge",
  },
];

type SlashCommandMenuProps = {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  selectedIndex: number;
  supportsTools?: boolean;
  context?: SlashCommandContext;
};

function SlashCommandMenuItem({
  cmd,
  index,
  onSelect,
  selectedIndex,
  supportsTools = true,
}: {
  cmd: SlashCommand;
  index: number;
  onSelect: (command: SlashCommand) => void;
  selectedIndex: number;
  supportsTools?: boolean;
}) {
  const isTool = cmd.action.startsWith("tool-");
  const isDisabled = isTool && !supportsTools;

  const handleClick = useCallback(() => {
    if (isDisabled) {
      toast.warning(
        "Ce modèle ne prend pas en charge les outils (tools). Cette commande est indisponible pour ce modèle."
      );
      return;
    }
    onSelect(cmd);
  }, [cmd, isDisabled, onSelect]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
    },
    []
  );

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
        isDisabled
          ? "opacity-40 cursor-not-allowed"
          : index === selectedIndex
            ? "bg-muted/70"
            : "hover:bg-muted/40"
      )}
      data-selected={index === selectedIndex && !isDisabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      type="button"
    >
      <div className="flex size-6 shrink-0 items-center justify-center text-muted-foreground/60">
        {cmd.icon}
      </div>
      <span className="font-mono text-[13px] text-foreground">/{cmd.name}</span>
      <span className="text-[12px] text-muted-foreground/50">
        {cmd.description}
      </span>
      {isDisabled ? (
        <span className="ml-auto text-[9px] bg-destructive/10 text-destructive font-semibold px-1.5 py-0.2 rounded">
          Sans tools
        </span>
      ) : cmd.shortcut ? (
        <span className="ml-auto text-[11px] text-muted-foreground/30">
          {cmd.shortcut}
        </span>
      ) : null}
    </button>
  );
}

export type SlashCommandContext = {
  // Page d'accueil = aucune conversation en cours
  isHome?: boolean;
  // Plans gratuits : /agents masquée
  isFree?: boolean;
};

export function getFilteredSlashCommands(
  query: string,
  context?: SlashCommandContext
): SlashCommand[] {
  let list = slashCommands;
  if (context?.isHome) {
    // Pas de conversation à exporter sur l'accueil
    list = list.filter((cmd) => cmd.action !== "export");
  } else if (context?.isHome === false) {
    // Conversation commencée : /agents masquée
    list = list.filter((cmd) => cmd.action !== "agents");
  }
  if (context?.isFree) {
    list = list.filter((cmd) => cmd.action !== "agents");
  }
  const q = query.toLowerCase().trim();
  if (!q) {
    return list;
  }
  return list.filter((cmd) => {
    const name = cmd.name.toLowerCase();
    if (name.startsWith(q) || name.includes(q)) {
      return true;
    }
    if (
      cmd.aliases?.some(
        (a) => a.toLowerCase().startsWith(q) || a.toLowerCase().includes(q)
      )
    ) {
      return true;
    }
    if (cmd.description.toLowerCase().includes(q)) {
      return true;
    }
    return false;
  });
}

export function SlashCommandMenu({
  query,
  onSelect,
  onClose: _onClose,
  selectedIndex,
  supportsTools = true,
  context,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const filtered = getFilteredSlashCommands(query, context);

  useEffect(() => {
    const selected = menuRef.current?.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, []);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-3 overflow-hidden rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 text-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
      ref={menuRef}
    >
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
        <span>Commandes (/)</span>
        <span className="text-[10px] normal-case tracking-normal font-normal text-muted-foreground/70">
          {filtered.length} commande(s)
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto pb-1 no-scrollbar">
        {filtered.map((cmd, index) => (
          <SlashCommandMenuItem
            cmd={cmd}
            index={index}
            key={cmd.name}
            onSelect={onSelect}
            selectedIndex={selectedIndex}
            supportsTools={supportsTools}
          />
        ))}
      </div>
    </div>
  );
}
