"use client";

import {
  DownloadIcon,
  FolderArchiveIcon,
  GhostIcon,
  PanelLeftIcon,
  SparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveChat } from "@/hooks/use-active-chat";
import { MAI_UPGRADE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const { isGhostMode, toggleGhostMode } = useActiveChat();

  const handleExport = useCallback(
    async (format: "md" | "json" | "txt") => {
      try {
        const res = await fetch(`/api/chats/${chatId}/export?format=${format}`);
        if (!res.ok) {
          throw new Error("Export échoué");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-${chatId}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Export ${format.toUpperCase()} téléchargé`);
      } catch (e: any) {
        toast.error(e.message || "Erreur export");
      }
    },
    [chatId]
  );

  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  return (
    <header
      className={`sticky top-0 z-10 flex items-center gap-2 bg-sidebar/80 backdrop-blur-md px-4 border-b border-border/40 ${isCollapsedDesktop ? "h-10" : "h-14"}`}
    >
      {isCollapsedDesktop && (
        <Button
          aria-label="Ouvrir sidebar"
          onClick={toggleSidebar}
          size="icon-sm"
          variant="ghost"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
      )}
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <Link
        className="flex size-7 items-center justify-center rounded-lg md:hidden overflow-hidden"
        href="/"
      >
        <Image
          alt="mAI"
          className="rounded-md"
          height={24}
          src="/logo.png"
          width={24}
        />
      </Link>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={
              isGhostMode
                ? "Désactiver le Mode fantôme"
                : "Activer le Mode fantôme"
            }
            className={cn(
              "h-8 rounded-xl text-xs gap-1.5 px-2.5 transition-all border cursor-pointer",
              isGhostMode
                ? "bg-purple-500/15 border-purple-500/40 text-purple-400 font-medium shadow-xs ring-1 ring-purple-500/30 hover:bg-purple-500/25"
                : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleGhostMode}
            size="sm"
            variant="ghost"
          >
            <GhostIcon
              className={cn(
                "size-3.5 shrink-0",
                isGhostMode
                  ? "text-purple-400 animate-pulse"
                  : "text-muted-foreground"
              )}
            />
            <span>{isGhostMode ? "Fantôme actif" : "Fantôme"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isGhostMode
            ? "Mode fantôme actif : discussion éphémère, non sauvegardée, sans génération d'image"
            : "Activer le Mode fantôme : temporaire, non sauvegardé en BDD, sans génération d'image"}
        </TooltipContent>
      </Tooltip>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="hidden sm:inline-flex rounded-xl text-xs gap-1.5 h-8 border-border/60 hover:bg-muted"
              size="sm"
              variant="outline"
            >
              <DownloadIcon className="size-3.5" />
              <span>Exporter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => handleExport("md")}>
              Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              JSON (.json)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("txt")}>
              Texte (.txt)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          asChild
          className="hidden sm:inline-flex rounded-xl text-xs gap-1.5 h-8 border-border/60 hover:bg-muted"
          size="sm"
          variant="outline"
        >
          <Link href="/library">
            <FolderArchiveIcon className="size-3.5" />
            <span>Stockage</span>
          </Link>
        </Button>

        <Button
          asChild
          className="hidden sm:inline-flex rounded-xl bg-foreground px-3 text-background hover:bg-foreground/90 text-xs gap-1.5 h-8 font-medium shadow-sm"
          size="sm"
        >
          <Link
            href={MAI_UPGRADE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <SparklesIcon className="size-3.5 text-amber-400" />
            <span>Passer à mAI Pro</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
);
