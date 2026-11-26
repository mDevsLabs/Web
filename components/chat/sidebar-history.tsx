"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import { SessionRecovery } from "@/components/chat/session-recovery";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  revalidateChatHistories,
  useChatHistoryReset,
} from "@/hooks/revalidate-chat-histories";
import { useActiveChat } from "@/hooks/use-active-chat";
import { useProjects } from "@/hooks/use-projects";
import { groupChatsByDate } from "@/lib/chat/history-groups";
import type { Chat } from "@/lib/db/schema";
import { forceUnlockDOM, forceUnlockDOMSchedule } from "@/lib/ui/unlock-dom";
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { SecureConversationDialog } from "./secure-conversation-dialog";
import { ChatItem } from "./sidebar-history-item";

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory | null
) {
  if (
    previousPageData &&
    (previousPageData.hasMore === false ||
      !Array.isArray(previousPageData.chats))
  ) {
    return null;
  }

  if (pageIndex === 0) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?limit=${PAGE_SIZE}`;
  }

  const firstChatFromPage = previousPageData?.chats?.at(-1);

  if (!firstChatFromPage) {
    return null;
  }

  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({
  hasDeadSession,
  user,
}: {
  hasDeadSession?: boolean;
  user?: { email?: string; id?: string } | undefined;
}) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;
  const { projects } = useProjects();

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    error,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    user ? getChatHistoryPaginationKey : () => null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const resetHistoryPage = useCallback(() => {
    setSize(1);
  }, [setSize]);
  useChatHistoryReset(resetHistoryPage);

  const router = useRouter();
  const { resetChat } = useActiveChat();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [securityChat, setSecurityChat] = useState<Chat | null>(null);

  // Sécurité anti-gel Radix UI : s'assurer que pointer-events et le DOM ne restent jamais bloqués
  useEffect(() => {
    if (!showDeleteDialog) {
      if (
        typeof document !== "undefined" &&
        document.body.style.pointerEvents === "none"
      ) {
        document.body.style.pointerEvents = "";
      }
      forceUnlockDOMSchedule();
    }
  }, [showDeleteDialog]);

  useEffect(
    () => () => {
      if (
        typeof document !== "undefined" &&
        document.body.style.pointerEvents === "none"
      ) {
        document.body.style.pointerEvents = "";
      }
      forceUnlockDOM();
    },
    []
  );

  const allChats = paginatedChatHistories
    ? paginatedChatHistories.flatMap((page) =>
        Array.isArray(page?.chats) ? page.chats : []
      )
    : [];

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => !page || page.hasMore === false)
    : false;

  const hasEmptyChatHistory =
    !isLoading &&
    !error &&
    Boolean(
      paginatedChatHistories &&
        paginatedChatHistories.length > 0 &&
        allChats.length === 0
    );

  const handleDelete = useCallback(() => {
    const chatToDelete = deleteId;
    if (!chatToDelete) {
      return;
    }
    const isCurrentChat =
      pathname === `/chat/${chatToDelete}` ||
      pathname?.startsWith(`/chat/${chatToDelete}/`);

    // 1. Fermer la boîte de dialogue et libérer immédiatement les événements pointeur
    setShowDeleteDialog(false);
    setDeleteId(null);
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "";
    }
    forceUnlockDOMSchedule();

    // 2. Si c'est la discussion active, réinitialiser l'état immédiatement
    if (isCurrentChat) {
      resetChat();
    }

    // 3. Retirer immédiatement la discussion de l'affichage (mise à jour optimiste)
    mutate(
      (current) => {
        if (!current) return current;
        return current.map((page) => ({
          ...page,
          chats: Array.isArray(page?.chats)
            ? page.chats.filter((c) => c.id !== chatToDelete)
            : [],
        }));
      },
      { revalidate: false }
    );

    // 4. Exécuter l'appel réseau avec keepalive: true pour garantir son acheminement
    void (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatToDelete}`,
          { keepalive: true, method: "DELETE" }
        );
        if (!res.ok) {
          toast.error("Erreur lors de la suppression");
          await revalidateChatHistories();
          return;
        }
        toast.success("Discussion supprimée");
        if (isCurrentChat) {
          router.replace("/");
        }
        await revalidateChatHistories();
      } catch {
        toast.error("Erreur lors de la suppression");
        await revalidateChatHistories();
      } finally {
        // La fermeture de l'AlertDialog peut laisser le verrou Radix en place
        // après la navigation: on le relâche quoi qu'il arrive.
        if (
          typeof document !== "undefined" &&
          document.body.style.pointerEvents === "none"
        ) {
          document.body.style.pointerEvents = "";
        }
        forceUnlockDOMSchedule();
      }
    })();
  }, [deleteId, mutate, pathname, resetChat, router]);

  const handleShowDeleteDialog = useCallback((chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  }, []);

  const handleViewportEnter = useCallback(() => {
    if (!isValidating && !isLoading && !error && !hasReachedEnd) {
      setSize((size) => size + 1);
    }
  }, [hasReachedEnd, isValidating, isLoading, error, setSize]);

  if (!user) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          {hasDeadSession ? (
            <SessionRecovery />
          ) : (
            // Cas « aucun cookie du tout » : le middleware renvoie normalement
            // vers /login avant d'arriver ici. Le lien reste rendu pour que
            // l'état ne soit jamais un cul-de-sac (base path personnalisé,
            // route ouverte en test…).
            <Link
              className="flex w-full flex-row items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              data-testid="history-login-link"
              href="/login"
            >
              Connectez-vous pour retrouver vos discussions !
            </Link>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          Historique
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col gap-0.5 px-1">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                className="flex h-8 items-center gap-2 rounded-lg px-2"
                key={item}
              >
                <div
                  className="h-3 max-w-(--skeleton-width) flex-1 animate-pulse rounded-md bg-sidebar-foreground/[0.06]"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (error && allChats.length === 0) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          Historique
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-center">
            <span className="text-[12px] text-muted-foreground">
              Impossible de charger l'historique.
            </span>
            <button
              className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              onClick={() => mutate()}
              type="button"
            >
              Réessayer
            </button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          Historique
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-[13px] text-sidebar-foreground/60 text-center py-4">
            Vos conversations apparaîtront ici dès que vous commencerez à
            discuter.
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          Historique
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedChatHistories
              ? (() => {
                  // `allChats` est la SEULE lecture des pages de l'historique :
                  // il filtre déjà les pages `undefined` que useSWRInfinite
                  // laisse pour une page en cours ou en erreur. Le recomputer
                  // ici sans garde faisait tomber toute la mise en page — la
                  // barre latérale partage le segment de route avec le
                  // compositeur — à la fin d chaque run Agent, qui revalide
                  // l'historique.
                  const groupedChats = groupChatsByDate(allChats);

                  return (
                    <div className="flex flex-col gap-4">
                      {groupedChats.pinned.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                            Épinglés
                          </div>
                          {groupedChats.pinned.map((chat) => (
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === id}
                              key={chat.id}
                              onDelete={handleShowDeleteDialog}
                              onManageSecurity={setSecurityChat}
                              projects={projects}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.today.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                            Aujourd'hui
                          </div>
                          {groupedChats.today.map((chat) => (
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === id}
                              key={chat.id}
                              onDelete={handleShowDeleteDialog}
                              onManageSecurity={setSecurityChat}
                              projects={projects}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.yesterday.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                            Hier
                          </div>
                          {groupedChats.yesterday.map((chat) => (
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === id}
                              key={chat.id}
                              onDelete={handleShowDeleteDialog}
                              onManageSecurity={setSecurityChat}
                              projects={projects}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.lastWeek.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                            7 derniers jours
                          </div>
                          {groupedChats.lastWeek.map((chat) => (
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === id}
                              key={chat.id}
                              onDelete={handleShowDeleteDialog}
                              onManageSecurity={setSecurityChat}
                              projects={projects}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.lastMonth.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                            30 derniers jours
                          </div>
                          {groupedChats.lastMonth.map((chat) => (
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === id}
                              key={chat.id}
                              onDelete={handleShowDeleteDialog}
                              onManageSecurity={setSecurityChat}
                              projects={projects}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}

                      {groupedChats.older.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
                            Plus ancien
                          </div>
                          {groupedChats.older.map((chat) => (
                            <ChatItem
                              chat={chat}
                              isActive={chat.id === id}
                              key={chat.id}
                              onDelete={handleShowDeleteDialog}
                              onManageSecurity={setSecurityChat}
                              projects={projects}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              : null}
          </SidebarMenu>

          <motion.div onViewportEnter={handleViewportEnter} />

          {!error && !hasReachedEnd && allChats.length > 0 && (
            <div className="mt-1 flex flex-row items-center gap-2 px-4 py-2 text-sidebar-foreground/50">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div className="text-[11px]">Chargement...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteId(null);
            if (typeof document !== "undefined") {
              document.body.style.pointerEvents = "";
            }
            forceUnlockDOMSchedule();
          }
        }}
        open={showDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette discussion ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La discussion sera définitivement
              effacée de nos serveurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                forceUnlockDOMSchedule();
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SecureConversationDialog
        chat={securityChat}
        onOpenChange={(open) => {
          if (!open) {
            setSecurityChat(null);
          }
        }}
        onSaved={() => {
          mutate();
        }}
      />
    </>
  );
}
