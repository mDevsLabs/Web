"use client";

import {
  BombIcon,
  CloudSunIcon,
  Code2Icon,
  FileTextIcon,
  FolderArchiveIcon,
  FolderKanbanIcon,
  GhostIcon,
  GlobeIcon,
  ImageIcon,
  LightbulbIcon,
  ListIcon,
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
import { cn } from "@/lib/utils";

export type SlashCommandAction =
  | "new"
  | "clear"
  | "ghost"
  | "rename"
  | "model"
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
    description: "Activer génération audio & voix (one-shot, fortement recommandé)",
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
};

function SlashCommandMenuItem({
  cmd,
  index,
  onSelect,
  selectedIndex,
}: {
  cmd: SlashCommand;
  index: number;
  onSelect: (command: SlashCommand) => void;
  selectedIndex: number;
}) {
  const handleClick = useCallback(() => {
    onSelect(cmd);
  }, [cmd, onSelect]);

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
        index === selectedIndex ? "bg-muted/70" : "hover:bg-muted/40"
      )}
      data-selected={index === selectedIndex}
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
      {cmd.shortcut ? (
        <span className="ml-auto text-[11px] text-muted-foreground/30">
          {cmd.shortcut}
        </span>
      ) : null}
    </button>
  );
}

export function getFilteredSlashCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    return slashCommands;
  }
  return slashCommands.filter((cmd) => {
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
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const filtered = getFilteredSlashCommands(query);

  useEffect(() => {
    const selected = menuRef.current?.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-full left-0 right-0 z-50 mb-3 overflow-hidden rounded-2xl border border-border/80 bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
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
          />
        ))}
      </div>
    </div>
  );
}
