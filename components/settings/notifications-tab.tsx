"use client";

import {
  AlertCircleIcon,
  BellIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from "@mdevs/icons";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { reopenNotificationPrompt } from "@/components/chat/notification-permission-gate";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/utils";

export function NotificationsTab() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifAiResponse, setNotifAiResponse] = useState(true);
  const [notifProject, setNotifProject] = useState(true);
  const [notifMcp, setNotifMcp] = useState(true);
  const [notifMcpAccess, setNotifMcpAccess] = useState(true);
  const [notifNews, setNotifNews] = useState(true);
  const [notifPlanningTaskCompleted, setNotifPlanningTaskCompleted] =
    useState(true);
  const [notifQuotaWarning, setNotifQuotaWarning] = useState(true);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<string>("default");

  const { data: notifPrefsData, mutate: mutateNotifPrefs } = useSWR(
    "/api/notifications/preferences",
    fetcher,
    { dedupingInterval: 10_000 }
  );

  useEffect(() => {
    if (notifPrefsData) {
      if (typeof notifPrefsData.enabled === "boolean") {
        setNotifEnabled(notifPrefsData.enabled);
      }
      if (typeof notifPrefsData.aiResponse === "boolean") {
        setNotifAiResponse(notifPrefsData.aiResponse);
      }
      if (typeof notifPrefsData.projectCreated === "boolean") {
        setNotifProject(notifPrefsData.projectCreated);
      }
      if (typeof notifPrefsData.mcpCreated === "boolean") {
        setNotifMcp(notifPrefsData.mcpCreated);
      }
      if (typeof notifPrefsData.mcpAccessRequest === "boolean") {
        setNotifMcpAccess(notifPrefsData.mcpAccessRequest);
      }
      if (typeof notifPrefsData.news === "boolean") {
        setNotifNews(notifPrefsData.news);
      }
      if (typeof notifPrefsData.planningTaskCompleted === "boolean") {
        setNotifPlanningTaskCompleted(notifPrefsData.planningTaskCompleted);
      }
      if (typeof notifPrefsData.quotaWarning === "boolean") {
        setNotifQuotaWarning(notifPrefsData.quotaWarning);
      }
    }
  }, [notifPrefsData]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPerm(Notification.permission);
    } else {
      setBrowserPerm("unsupported");
    }
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !navigator.permissions?.query
    ) {
      return;
    }
    let permStatus: PermissionStatus | null = null;
    const syncPerm = () => setBrowserPerm(Notification.permission);
    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((p) => {
        permStatus = p;
        syncPerm();
        p.addEventListener("change", syncPerm);
      })
      .catch(() => {});
    const onFocus = () => {
      if ("Notification" in window) {
        setBrowserPerm(Notification.permission);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => {
      permStatus?.removeEventListener("change", syncPerm);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleRequestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error(
        "Les notifications ne sont pas supportées par ce navigateur."
      );
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPerm(perm);
      if (perm === "granted") {
        toast.success("Permission accordée ! Vous recevrez les notifications.");
        if (!notifEnabled) {
          setNotifEnabled(true);
          fetch("/api/notifications/preferences", {
            body: JSON.stringify({ enabled: true, news: true }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          })
            .then(() => mutateNotifPrefs())
            .catch(() => {});
        }
      } else if (perm === "denied") {
        toast.error(
          "Permission refusée. Activez-la dans les paramètres du navigateur."
        );
      }
    } catch {
      toast.error("Impossible de demander la permission.");
    }
  }, [notifEnabled, mutateNotifPrefs]);

  const handleReopenNotificationPrompt = useCallback(() => {
    reopenNotificationPrompt();
  }, []);

  const handleSaveNotifPrefs = useCallback(async () => {
    setIsSavingNotif(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        body: JSON.stringify({
          aiResponse: notifAiResponse,
          enabled: notifEnabled,
          mcpAccessRequest: notifMcpAccess,
          mcpCreated: notifMcp,
          news: notifNews,
          planningTaskCompleted: notifPlanningTaskCompleted,
          projectCreated: notifProject,
          quotaWarning: notifQuotaWarning,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur sauvegarde");
      toast.success("Préférences de notifications enregistrées !");
      mutateNotifPrefs();
      if (
        notifEnabled &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        handleRequestNotificationPermission();
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setIsSavingNotif(false);
    }
  }, [
    notifEnabled,
    notifAiResponse,
    notifProject,
    notifMcp,
    notifMcpAccess,
    notifNews,
    notifPlanningTaskCompleted,
    notifQuotaWarning,
    mutateNotifPrefs,
    handleRequestNotificationPermission,
  ]);

  return (
    <div className="py-6 flex flex-col gap-6 max-w-4xl">
      <div
        className="surface-card flex flex-col gap-5 scroll-mt-6"
        id="notif-main"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-info/10 text-info ring-1 ring-info/20">
            <BellIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">
              Notifications
            </h3>
            <p className="text-xs text-muted-foreground">
              Gérez l'envoi et la personnalisation de vos notifications.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <span
              className={`text-xs px-2 py-1 rounded-full border font-medium ${
                notifEnabled
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted text-muted-foreground border-border/50"
              }`}
            >
              {notifEnabled ? "Activées" : "Désactivées"}
            </span>
            <Button
              className="h-8 gap-1.5 text-xs"
              onClick={handleReopenNotificationPrompt}
              type="button"
              variant="outline"
            >
              <BellIcon className="size-3.5" />
              Revoir l'invite
            </Button>
          </div>
        </div>

        {/* Demande permission */}
        {browserPerm === "granted" ? (
          <div className="p-3 rounded-xl border border-success/20 bg-success/5 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-success shrink-0" />
              Permission accordée
            </span>
            <button
              aria-label="Redemander l'autorisation"
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              onClick={handleRequestNotificationPermission}
              title="Redemander l'autorisation"
              type="button"
            >
              <RefreshCwIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-warning/20 bg-warning/5 flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  Permission du navigateur
                </span>
                <span className="text-xs text-muted-foreground">
                  {browserPerm === "denied"
                    ? "Les notifications sont bloquées. Autorisez-les dans les réglages de votre navigateur."
                    : browserPerm === "unsupported"
                      ? "Ce navigateur ne prend pas en charge les notifications système."
                      : "Autorisez les notifications pour les recevoir sur cet appareil."}
                </span>
              </div>
              <button
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  browserPerm === "denied" || browserPerm === "unsupported"
                }
                onClick={handleRequestNotificationPermission}
                type="button"
              >
                <BellIcon className="size-3.5" />
                Demander l'autorisation
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              En activant, vous acceptez de recevoir des notifications
              navigateur et dans l'application. Consultez{" "}
              <a className="underline text-primary" href="/site/legal/privacy">
                la politique de confidentialité
              </a>{" "}
              pour la politique RGPD.
            </p>
          </div>
        )}

        {/* Toggle global */}
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Activer les notifications
            </span>
            <span className="text-xs text-muted-foreground">
              Ce réglage active ou coupe toutes les notifications. Les
              actualités mAI sont activées par défaut.
            </span>
          </div>
          <input
            checked={notifEnabled}
            className="size-5 shrink-0 accent-primary"
            onChange={(e) => {
              const v = e.target.checked;
              setNotifEnabled(v);
              if (v) setNotifNews(true);
            }}
            type="checkbox"
          />
        </label>

        {/* Granulaires */}
        <div
          className={`flex flex-col gap-3 pt-3 border-t border-border/40 ${
            notifEnabled ? "" : "opacity-50 pointer-events-none"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Personnalisation
          </p>
          {[
            {
              desc: "À chaque réponse de l'IA dans vos conversations",
              key: "ai",
              label: "Réponse de l'IA",
              setter: setNotifAiResponse,
              value: notifAiResponse,
            },
            {
              desc: "Lors de la création d'un nouveau dossier/projet",
              key: "project",
              label: "Nouveau projet",
              setter: setNotifProject,
              value: notifProject,
            },
            {
              desc: "Lors de l'ajout d'un nouveau serveur MCP",
              key: "mcp",
              label: "Nouveau MCP",
              setter: setNotifMcp,
              value: notifMcp,
            },
            {
              desc: "Lorsqu'un outil MCP demande une autorisation d'écriture ou d'exécution",
              key: "mcpAccess",
              label: "Demande d'accès MCP",
              setter: setNotifMcpAccess,
              value: notifMcpAccess,
            },
            {
              desc: "Actualités et annonces mAI (via admin, activé par défaut si notifications on)",
              key: "news",
              label: "Actualités mAI",
              setter: setNotifNews,
              value: notifNews,
            },
            {
              desc: "Lorsqu'une tâche de planification automatique se termine avec succès",
              key: "planningTaskCompleted",
              label: "Tâche planifiée terminée",
              setter: setNotifPlanningTaskCompleted,
              value: notifPlanningTaskCompleted,
            },
            {
              desc: "Alerte en cas d'atteinte de 90% ou 100% de votre quota mAI",
              key: "quotaWarning",
              label: "Alerte de quota",
              setter: setNotifQuotaWarning,
              value: notifQuotaWarning,
            },
          ].map((item) => (
            <label
              className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/30 cursor-pointer"
              key={item.key}
            >
              <div className="flex flex-col pr-3">
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.desc}
                </span>
              </div>
              <input
                checked={item.value}
                className="size-4 shrink-0 accent-primary"
                disabled={!notifEnabled}
                onChange={(e) => (item.setter as any)(e.target.checked)}
                type="checkbox"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
            disabled={isSavingNotif}
            onClick={handleSaveNotifPrefs}
            type="button"
          >
            {isSavingNotif ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            {isSavingNotif
              ? "Enregistrement..."
              : "Enregistrer les notifications"}
          </button>
        </div>
      </div>

      <div
        className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-3 scroll-mt-6"
        id="notif-rgpd"
      >
        <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">RGPD & Données</p>
          <p>
            Vos préférences et notifications sont sécurisées dans votre profil
            et synchronisées sur vos appareils. Plus d'infos sur{" "}
            <a className="text-primary underline" href="/site/legal/privacy">
              la politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
