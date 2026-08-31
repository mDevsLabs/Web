"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BrainIcon,
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
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
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
import { useActiveChat } from "@/hooks/use-active-chat";
import { cn, fetcher } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { getChatHistoryPaginationKey } from "./sidebar-history";
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
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  // Fantôme uniquement sur la page d'accueil (nouvelle conversation)
  const showGhost = isHome;

  const { data: chatData } = useSWR(
    !isHome && chatId ? `/api/chats/${chatId}` : null,
    fetcher
  );
  const { mutate } = useSWRConfig();
  const isArchived = (chatData as any)?.isArchived ?? false;
  const isPinned = (chatData as any)?.pinned ?? false;

  const [_isRenaming, _setIsRenaming] = useState(false);

  // Préférence « mémoire en mode fantôme » (persistée en base via /api/user/preferences)
  const { data: ghostPrefsData, mutate: mutateGhostPrefs } = useSWR(
    showGhost ? "/api/user/preferences" : null,
    fetcher
  );
  const ghostMemoryEnabled = Boolean(ghostPrefsData?.ghostMemoryEnabled);
  const [isGhostMemSaving, setIsGhostMemSaving] = useState(false);

  const handleToggleGhostMemory = useCallback(
    async (next: boolean) => {
      setIsGhostMemSaving(true);
      try {
        await mutateGhostPrefs(
          { ...ghostPrefsData, ghostMemoryEnabled: next },
          {
            revalidate: false,
            rollbackOnError: true,
          }
        );
        const res = await fetch("/api/user/preferences", {
          body: JSON.stringify({ ghostMemoryEnabled: next }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Erreur de sauvegarde de la préférence");
        }
        await mutateGhostPrefs();
        toast.success(
          next
            ? "Mémoire activée pour les discussions fantômes"
            : "Mémoire désactivée pour les discussions fantômes"
        );
      } catch (e: any) {
        await mutateGhostPrefs();
        toast.error(e.message || "Erreur de sauvegarde de la préférence");
      } finally {
        setIsGhostMemSaving(false);
      }
    },
    [ghostPrefsData, mutateGhostPrefs]
  );

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
    const next = window.prompt(
      "Nouveau titre de la conversation :",
      currentTitle
    );
    if (next === null) {
      return;
    }
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentTitle) {
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        body: JSON.stringify({ title: trimmed }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Erreur");
      }
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
      if (!res.ok) {
        throw new Error();
      }
      toast.success(isArchived ? "Désarchivée" : "Archivée");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    } catch {
      toast.error("Erreur archivage");
    }
  }, [chatId, isArchived, mutate]);

  const handleTogglePin = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        body: JSON.stringify({ pinned: !isPinned }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error();
      }
      toast.success(isPinned ? "Désépinglée" : "Épinglée");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    } catch {
      toast.error("Erreur épinglage");
    }
  }, [chatId, isPinned, mutate]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Supprimer définitivement cette conversation ?")) {
      return;
    }
    try {
      const res = await fetch(`/api/chat?id=${chatId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error();
      }
      toast.success("Conversation supprimée");
      router.push("/");
    } catch {
      toast.error("Erreur suppression");
    }
  }, [chatId, router]);

  const isCollapsedDesktop = state === "collapsed" && !isMobile;

  return (
    <header
      className={`sticky top-0 z-10 flex items-center gap-1.5 sm:gap-2 bg-sidebar/90 supports-[backdrop-filter]:bg-sidebar/80 backdrop-blur-sm sm:backdrop-blur-md px-2 sm:px-4 border-b border-border/40 ${isCollapsedDesktop ? "h-[calc(env(safe-area-inset-top)+2.5rem)] pt-[env(safe-area-inset-top)]" : "h-[calc(env(safe-area-inset-top)+3.5rem)] pt-[env(safe-area-inset-top)]"}`}
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
        className="md:hidden min-h-[44px] min-w-[44px] h-11 w-11 -ml-1"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-5" />
      </Button>

      <Link
        className="flex size-8 items-center justify-center rounded-lg md:hidden overflow-hidden shrink-0"
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
                window.dispatchEvent(
                  new CustomEvent("open-conversation-search")
                )
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
                navigator.clipboard
                  .writeText(url)
                  .then(() => toast.success("Lien copié"));
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
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              <TrashIcon className="size-4" />
              <span>Supprimer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showGhost && (
        <div className="relative group/ghost flex items-center">
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
          {/* Panneau options au survol : personnalisation mémoire */}
          <div
            className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border/70 bg-popover p-3.5 text-popover-foreground shadow-2xl ring-1 ring-foreground/5 opacity-0 invisible translate-y-1 pointer-events-none transition-all duration-150 group-hover/ghost:opacity-100 group-hover/ghost:visible group-hover/ghost:translate-y-0 group-hover/ghost:pointer-events-auto group-focus-within/ghost:opacity-100 group-focus-within/ghost:visible group-focus-within/ghost:pointer-events-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-2 mb-2">
              <GhostIcon className="size-3.5 text-purple-400 shrink-0" />
              <span className="text-xs font-semibold">Mode fantôme</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                Discussion éphémère
              </span>
            </div>
            <label
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors",
                ghostMemoryEnabled
                  ? "border-sky-500/50 bg-sky-500/10"
                  : "border-border/50 hover:bg-muted/40"
              )}
            >
              <input
                checked={ghostMemoryEnabled}
                className="mt-0.5 size-3.5 accent-sky-600 cursor-pointer"
                disabled={isGhostMemSaving}
                onChange={(e) => handleToggleGhostMemory(e.target.checked)}
                type="checkbox"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <BrainIcon className="size-3.5 text-sky-600 dark:text-sky-400" />
                  Personnaliser avec la mémoire
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">
                  L'IA pourra utiliser votre mémoire personnalisée dans les
                  discussions fantômes (la discussion elle-même reste non
                  enregistrée). Choix mémorisé pour vos prochaines sessions.
                </span>
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Export compact (mobile) */}
        {!isHome && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Exporter"
              className="sm:hidden rounded-xl text-xs h-8 w-8 p-0 border-border/60 hover:bg-muted"
              size="sm"
              variant="outline"
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
        )}
        {!isHome && (
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
        )}
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
