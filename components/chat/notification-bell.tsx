"use client";

import {
  AlertTriangle,
  BellIcon,
  Bot,
  CalendarClock,
  CheckCheckIcon,
  CheckIcon,
  Folder,
  Lock,
  Megaphone,
  Puzzle,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

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
    case "planning_task_completed":
      return <CalendarClock className="size-4 text-emerald-500" />;
    case "quota_warning":
      return <AlertTriangle className="size-4 text-amber-500" />;
    default:
      return <BellIcon className="size-4" />;
  }
}

export function NotificationBell() {
  const { data, mutate, isLoading } = useNotifications(20);
  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;
  const [open, setOpen] = useState(false);
  const prevUnreadRef = useRef<number>(unread);
  const initializedRef = useRef(false);

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
      await fetch("/api/notifications", {
        body: JSON.stringify({ action: "markAllRead" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
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
    if (!confirm("Voulez-vous vraiment supprimer toutes vos notifications ?")) {
      return;
    }
    try {
      await fetch("/api/notifications?all=true", { method: "DELETE" });
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
      await fetch(`/api/notifications/${id}`, {
        body: JSON.stringify({ action: isRead ? "read" : "unread", isRead }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
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
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
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
    } catch {}
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
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] p-0 overflow-hidden border-border/60 shadow-xl"
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

        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="rounded-full bg-muted p-3 mb-3">
                <BellIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vos alertes IA, projets, MCP et actualités apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/40">
              {notifications.map((n) => (
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
                          href={n.link}
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
                        n.isRead ? "Marquer comme non lu" : "Marquer comme lu"
                      }
                      type="button"
                    >
                      <CheckCheckIcon
                        className={cn("size-3.5", !n.isRead && "text-primary")}
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
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-border/40 bg-muted/20 p-2 flex justify-center">
            <Link
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              href="/settings?tab=notifications"
              onClick={() => setOpen(false)}
            >
              Voir tous les paramètres
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
