"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CopyIcon,
  DownloadIcon,
  Edit2Icon,
  GhostIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveChat } from "@/hooks/use-active-chat";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/utils";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";
import { NotificationBell } from "./notification-bell";

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
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  // Fantôme uniquement sur la page d'accueil (nouvelle conversation)
  const showGhost = isHome;

  const { data: chatData } = useSWR(
    !isHome && chatId ? `/api/chats/${chatId}` : null,
    fetcher
  );
  const isArchived = (chatData as any)?.isArchived ?? false;
  const isPinned = (chatData as any)?.pinned ?? false;

  const [isRenaming, setIsRenaming] = useState(false);

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

  const handleCopyId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chatId);
      toast.success(`ID copié : ${chatId}`);
    } catch {
      toast.error("Impossible de copier l'ID");
    }
  }, [chatId]);

  const handleRename = useCallback(async () => {
    const currentTitle = (chatData as any)?.title ?? "";
    const next = window.prompt("Nouveau titre de la conversation :", currentTitle);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentTitle) return;
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        body: JSON.stringify({ title: trimmed }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Conversation renommée");
    } catch {
      toast.error("Erreur lors du renommage");
    }
  }, [chatId, chatData]);

  const handleToggleArchive = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        body: JSON.stringify({ isArchived: !isArchived }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      toast.success(isArchived ? "Désarchivée" : "Archivée");
    } catch {
      toast.error("Erreur archivage");
    }
  }, [chatId, isArchived]);

  const handleTogglePin = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        body: JSON.stringify({ pinned: !isPinned }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      toast.success(isPinned ? "Désépinglée" : "Épinglée");
    } catch {
      toast.error("Erreur épinglage");
    }
  }, [chatId, isPinned]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Supprimer définitivement cette conversation ?")) return;
    try {
      const res = await fetch(`/api/chat?id=${chatId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Conversation supprimée");
      router.push("/");
    } catch {
      toast.error("Erreur suppression");
    }
  }, [chatId, router]);

  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  return (
    <header
      className={`sticky top-0 z-10 flex items-center gap-2 bg-sidebar/80 backdrop-blur-md px-4 border-b border-border/40 ${isCollapsedDesktop ? "h-[calc(env(safe-area-inset-top)+2.5rem)]" : "h-[calc(env(safe-area-inset-top)+3.5rem)]"}`}
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

      {/* Options de conversation — à côté du VisibilitySelector (haut à gauche) */}
      {!isHome && !isReadonly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Options de conversation"
              className="h-8 rounded-xl text-xs gap-1.5 px-2.5 border border-border/60 hover:bg-muted"
              size="sm"
              variant="ghost"
            >
              <MoreHorizontalIcon className="size-4" />
              <span className="hidden sm:inline">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-conversation-search"))
              }
            >
              <SearchIcon className="size-4" />
              <span>Rechercher dans la conversation</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRename}>
              <Edit2Icon className="size-4" />
              <span>Renommer</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyId}>
              <CopyIcon className="size-4" />
              <span>Copier l'ID</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/chat/${chatId}`;
                navigator.clipboard.writeText(url).then(() => toast.success("Lien copié"));
              }}
            >
              <CopyIcon className="size-4" />
              <span>Copier le lien</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleTogglePin}>
              {isPinned ? (
                <PinOffIcon className="size-4" />
              ) : (
                <PinIcon className="size-4" />
              )}
              <span>{isPinned ? "Désépingler" : "Épingler"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleArchive}>
              {isArchived ? (
                <ArchiveRestoreIcon className="size-4" />
              ) : (
                <ArchiveIcon className="size-4" />
              )}
              <span>{isArchived ? "Désarchiver" : "Archiver"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <DownloadIcon className="size-3.5" />
                <span>Exporter</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleExport("md")}>
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("txt")}>
                  Texte (.txt)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <TrashIcon className="size-4" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showGhost && (
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
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Export compact (mobile) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="sm:hidden rounded-xl text-xs h-8 w-8 p-0 border-border/60 hover:bg-muted"
              size="sm"
              variant="outline"
              aria-label="Exporter"
            >
              <DownloadIcon className="size-4" />
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
        <NotificationBell />
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
