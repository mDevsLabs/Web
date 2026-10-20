"use client";

import {
  AlertTriangleIcon as AlertTriangle,
  AtSignIcon as AtSign,
  BellIcon,
  BotIcon as Bot,
  CalendarClockIcon as CalendarClock,
  CheckCheckIcon,
  CheckCircle2Icon as CheckCircle2,
  CheckIcon,
  FolderIcon as Folder,
  HeartIcon as Heart,
  LockIcon as Lock,
  MegaphoneIcon as Megaphone,
  MessageCircleQuestionIcon as MessageCircleQuestion,
  MessageSquareIcon as MessageSquare,
  PuzzleIcon as Puzzle,
  QuoteIcon as Quote,
  RepeatIcon as Repeat,
  ShieldQuestionIcon as ShieldQuestion,
  Trash2Icon,
  TrashIcon,
  UserPlusIcon as UserPlus,
} from "@mdevs/icons";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toVibePath } from "@/components/vibe/router";
import {
  NOTIFICATION_ORIGIN_LABELS,
  type NotificationOrigin,
  useNotifications,
} from "@/hooks/use-notifications";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { cn } from "@/lib/utils";
import { ApiService } from "@/lib/vibe/services/api";

function formatRelative(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) {
      return "À l'instant";
    }
    if (mins < 60) {
      return `Il y a ${mins} min`;
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return `Il y a ${hours} h`;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      return "Hier";
    }
    return `Il y a ${days} j`;
  } catch {
    return "";
  }
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "ai_response":
      return <Bot className="size-4" />;
    case "mcp_access_request":
      return <Lock className="size-4" />;
    case "mcp_created":
      return <Puzzle className="size-4" />;
    case "news":
      return <Megaphone className="size-4" />;
    case "project_created":
      return <Folder className="size-4" />;
    case "project_member_joined":
      return <UserPlus className="size-4" />;
    case "planning_task_completed":
      return <CalendarClock className="size-4 text-success" />;
    case "quota_warning":
      return <AlertTriangle className="size-4 text-warning" />;
    // Types Agent : 6 lignes plutôt qu'un repli sur la cloche, sinon les
    // événements les plus importants (fin de run, approbation attendue)
    // s'affichaient comme une notification générique.
    case "agent_run_finished":
      return <CheckCircle2 className="size-4 text-success" />;
    case "agent_run_failed":
      return <AlertTriangle className="size-4 text-destructive" />;
    case "agent_approval_required":
      return <ShieldQuestion className="size-4 text-warning" />;
    case "agent_user_input_required":
      return <MessageCircleQuestion className="size-4 text-info" />;
    // Types Vibe (répliqués) : la nature de l'événement, pas un repli
    // générique. Sans ces lignes, toute l'activité sociale ressemblerait
    // à une notification mAI.
    case "vibe_like":
      return <Heart className="size-4" />;
    case "vibe_repost":
      return <Repeat className="size-4" />;
    case "vibe_quote":
      return <Quote className="size-4" />;
    case "vibe_mention":
      return <AtSign className="size-4" />;
    case "vibe_reply":
      return <MessageSquare className="size-4" />;
    case "vibe_dm":
      return <MessageSquare className="size-4" />;
    case "vibe_follow":
      return <UserPlus className="size-4" />;
    // Type Wakies : une réponse d'assistant.
    case "wakies_reply":
      return <Bot className="size-4" />;
    default:
      return <BellIcon className="size-4" />;
  }
}

/**
 * Le lien de destination d'une notification.
 *
 * Les notifications Vibe portent un chemin qui vit sous `/vibe`. La règle du
 * domaine est que TOUTE URL Vibe passe par `toVibePath` : un chemin écrit à
 * la main mènerait hors de `/vibe` chez le destinataire, et l'application
 * mobile comme le site de bureau verraient une 404.
 *
 * `toVibePath` est idempotent sur un chemin déjà préfixé : l'appeler
 * systématiquement est donc sans risque, et protège du cas où la source
 * stockerait un chemin non préfixé.
 */
function notificationHref(notification: {
  link: string | null;
  origin: string;
}): string {
  if (!notification.link) {
    return "/";
  }
  if (notification.origin === "vibe") {
    return toVibePath(notification.link);
  }
  return notification.link;
}

export function NotificationBell() {
  const { data, mutate, isLoading } = useNotifications(20);
  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;
  const [open, setOpen] = useState(false);
  // Filtre par application : sans lui, la cloche devient un flux unique
  // où l'activité de Vibe et les alertes d'Agent se confondent.
  const [origine, setOrigine] = useState<NotificationOrigin | "all">("all");
  const prevUnreadRef = useRef<number>(unread);
  const initializedRef = useRef(false);

  /**
   * Notifications groupées par origine, dans un ORDRE FIXE.
   *
   * L'ordre ne dépend pas de l'arrivée des événements : mAI d'abord, puis
   * Vibe, puis Wakies. Un ordre dépendant des dates ferait bouger les
   * en-têtes à chaque rafraîchissement — le lecteur ne retrouverait plus
   * sa section.
   */
  const groupes = useMemo(() => {
    const parOrigine = new Map<NotificationOrigin, typeof notifications>();
    for (const notification of notifications) {
      const source = notification.origin ?? "mai";
      const liste = parOrigine.get(source) ?? [];
      liste.push(notification);
      parOrigine.set(source, liste);
    }
    return (["mai", "vibe", "wakies"] as const)
      .filter((source) => origine === "all" || source === origine)
      .map((source) => ({
        notifications: parOrigine.get(source) ?? [],
        origin: source,
      }))
      .filter((groupe) => groupe.notifications.length > 0);
  }, [notifications, origine]);

  const nonLuesParOrigine = useMemo(() => {
    const compte = new Map<NotificationOrigin, number>();
    for (const notification of notifications) {
      if (notification.isRead) {
        continue;
      }
      const source = notification.origin ?? "mai";
      compte.set(source, (compte.get(source) ?? 0) + 1);
    }
    return compte;
  }, [notifications]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevUnreadRef.current = unread;
      return;
    }
    // Browser notification on new unread
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      unread > prevUnreadRef.current &&
      notifications.length > 0
    ) {
      const latest = notifications[0];
      try {
        const n = new Notification(latest.title, {
          body: latest.body ?? "",
          icon: "/logo.png",
        });
        n.onclick = () => {
          window.focus();
          if (latest.link) {
            window.location.href = latest.link;
          }
          n.close();
        };
        setTimeout(() => n.close(), 6000);
      } catch {}
    }
    prevUnreadRef.current = unread;
  }, [unread, notifications]);

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        body: JSON.stringify({ action: "markAllRead" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok)
        throw new Error("La mise à jour des notifications a échoué");
      // Propagation Vibe : le backend Vibe s'authentifie par un JWT que seul
      // le navigateur détient, donc la propagation se fait ici. Les
      // notifications Vibe encore non lues sont marquées en une passe.
      const vibeNonLues = notifications.filter(
        (n) => n.origin === "vibe" && !n.isRead && n.sourceId
      );
      if (vibeNonLues.length > 0) {
        void Promise.all(
          vibeNonLues.map((n) =>
            ApiService.markNotificationRead(n.sourceId as string, true).catch(
              () => {
                // L'état de l'hôte est déjà à jour.
              }
            )
          )
        );
      }
      mutate(
        (prev) =>
          prev
            ? {
                ...prev,
                notifications: prev.notifications.map((n) => ({
                  ...n,
                  isRead: true,
                })),
                unreadCount: 0,
              }
            : prev,
        false
      );
      toast.success("Toutes marquées comme lues");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDeleteAll = async () => {
    if (!notifications.length) {
      return;
    }
    if (
      !(await confirmInApp(
        "Voulez-vous vraiment supprimer toutes vos notifications ?"
      ))
    ) {
      return;
    }
    try {
      const response = await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("La suppression des notifications a échoué");
      mutate(
        (prev) =>
          prev
            ? {
                ...prev,
                notifications: [],
                unreadCount: 0,
              }
            : prev,
        false
      );
      toast.success("Toutes les notifications ont été supprimées");
    } catch {
      toast.error("Erreur lors de la suppression des notifications");
    }
  };

  const handleMarkOne = async (id: string, isRead = true) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        body: JSON.stringify({ action: isRead ? "read" : "unread", isRead }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok)
        throw new Error("La mise à jour de la notification a échoué");
      // La propagation vers Vibe se fait ICI, et non dans la route : le
      // backend Vibe s'authentifie par un JWT que seul le NAVIGATEUR
      // détient. Le serveur n'a pas de jeton à lui présenter.
      const notification = notifications.find((n) => n.id === id);
      if (notification?.origin === "vibe" && notification.sourceId) {
        void ApiService.markNotificationRead(
          notification.sourceId,
          isRead
        ).catch(() => {
          // L'état de l'hôte est déjà à jour : l'échec de la propagation
          // ne concerne que la page Vibe, qui se resynchronisera.
        });
      }
      mutate((prev) => {
        if (!prev) {
          return prev;
        }
        const target = prev.notifications.find((n) => n.id === id);
        if (!target || target.isRead === isRead) {
          return prev;
        }
        const diff = isRead ? -1 : 1;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, isRead } : n
          ),
          unreadCount: Math.max(0, (prev.unreadCount ?? 0) + diff),
        };
      }, false);
    } catch {
      toast.error("Impossible de mettre à jour la notification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("La suppression de la notification a échoué");
      mutate(
        (prev) =>
          prev
            ? {
                ...prev,
                notifications: prev.notifications.filter((n) => n.id !== id),
                unreadCount: prev.notifications.find(
                  (n) => n.id === id && !n.isRead
                )
                  ? Math.max(0, (prev.unreadCount ?? 1) - 1)
                  : prev.unreadCount,
              }
            : prev,
        false
      );
    } catch {
      toast.error("Impossible de supprimer la notification");
    }
  };

  // Demande la permission système au premier clic sur la cloche (geste
  // utilisateur requis par les navigateurs) pour recevoir les notifications
  // sur l'appareil, pas seulement dans l'app.
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (
      nextOpen &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Notifications"
          className="relative h-8 w-8 rounded-xl border border-border/60 hover:bg-muted"
          size="icon-sm"
          variant="ghost"
        >
          <BellIcon className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] max-w-[calc(100vw-1rem)] p-0 overflow-hidden border-border/60 shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <BellIcon className="size-4 text-primary" />
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                {unread} non lues
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                onClick={handleMarkAllRead}
                title="Tout marquer comme lu"
                type="button"
              >
                <CheckCheckIcon className="size-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={handleDeleteAll}
                title="Tout supprimer"
                type="button"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            )}
            <Link
              className="text-[11px] font-medium text-primary hover:underline px-1"
              href="/settings?tab=notifications"
              onClick={() => setOpen(false)}
            >
              Gérer
            </Link>
          </div>
        </div>

        {/* Filtre par application : les trois sources partagent une seule
            cloche, mais l'utilisateur peut n'en vouloir qu'une. */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-1 border-b border-border/40 bg-muted/10 px-2 py-1.5">
            {(
              [
                { id: "all" as const, label: "Tout" },
                { id: "mai" as const, label: "mAI" },
                { id: "vibe" as const, label: "Vibe" },
                { id: "wakies" as const, label: "Wakies" },
              ] as const
            ).map((option) => {
              // « Tout » n'est pas une origine : son compteur est le total
              // des trois, pas une entrée de la table.
              const nonLues =
                option.id === "all"
                  ? notifications.filter((n) => !n.isRead).length
                  : (nonLuesParOrigine.get(option.id) ?? 0);
              const actif = origine === option.id;
              return (
                <button
                  aria-pressed={actif}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                    actif
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-active={actif ? "true" : undefined}
                  key={option.id}
                  onClick={() => setOrigine(option.id)}
                  type="button"
                >
                  {option.label}
                  {nonLues > 0 ? (
                    <span className="ml-1 opacity-70">{nonLues}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
            </div>
          ) : groupes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="rounded-full bg-muted p-3 mb-3">
                <BellIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {origine === "all"
                  ? "Vos alertes IA, projets, MCP, actualités et l'activité de vos applications apparaîtront ici."
                  : `Aucune notification ${NOTIFICATION_ORIGIN_LABELS[origine as NotificationOrigin]}.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {groupes.map((groupe) => (
                <section key={groupe.origin}>
                  <h3 className="sticky top-0 z-10 bg-background/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                    {NOTIFICATION_ORIGIN_LABELS[groupe.origin]}
                  </h3>
                  <div className="flex flex-col divide-y divide-border/40">
                    {groupe.notifications.map((n) => (
                      <div
                        className={cn(
                          "group flex gap-3 px-3 py-3 hover:bg-muted/30 transition-colors relative",
                          !n.isRead && "bg-primary/5"
                        )}
                        key={n.id}
                      >
                        <div className="text-base leading-none mt-0.5 shrink-0">
                          <NotificationIcon type={n.type} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold leading-tight text-foreground line-clamp-1">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
                            )}
                          </div>
                          {n.body && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                              {n.body}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelative(n.createdAt)}
                            </span>
                            {n.link && (
                              <Link
                                className="text-[11px] font-medium text-primary hover:underline"
                                href={notificationHref(n)}
                                onClick={() => {
                                  if (!n.isRead) {
                                    handleMarkOne(n.id, true);
                                  }
                                  setOpen(false);
                                }}
                              >
                                Voir
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            className={cn(
                              "rounded-md p-1 transition-colors",
                              n.isRead
                                ? "text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
                                : "text-primary hover:bg-primary/10 hover:text-primary font-medium"
                            )}
                            onClick={() => handleMarkOne(n.id, !n.isRead)}
                            title={
                              n.isRead
                                ? "Marquer comme non lu"
                                : "Marquer comme lu"
                            }
                            type="button"
                          >
                            <CheckCheckIcon
                              className={cn(
                                "size-3.5",
                                !n.isRead && "text-primary"
                              )}
                            />
                          </button>
                          <button
                            className="rounded-md p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-70 group-hover:opacity-100"
                            onClick={() => handleDelete(n.id)}
                            title="Supprimer"
                            type="button"
                          >
                            <TrashIcon className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-border/40 bg-muted/20 p-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              href="/settings?tab=notifications"
              onClick={() => setOpen(false)}
            >
              Gérer les notifications
            </Link>
            <span aria-hidden className="hidden h-3 w-px bg-border sm:block" />
            <Link
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              href={toVibePath("/notifications")}
              onClick={() => setOpen(false)}
            >
              Voir l'activité Vibe
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
