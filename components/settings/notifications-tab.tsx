"use client";

import {
  AlertCircleIcon,
  BellIcon,
  BotIcon,
  CheckIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@mdevs/icons";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { reopenNotificationPrompt } from "@/components/chat/notification-permission-gate";
import { Button } from "@/components/ui/button";
import {
  readVibeNotificationPreferences,
  toVibeNotificationPayload,
  VIBE_NOTIFICATION_DEFAULTS,
  type VibeNotificationPreferences,
} from "@/lib/notifications/vibe-preferences";
import { cn, fetcher } from "@/lib/utils";
import { ApiService } from "@/lib/vibe/services/api";

/**
 * ============================================================================
 * PARAMÈTRES DE NOTIFICATIONS (components/settings/notifications-tab.tsx)
 * ============================================================================
 *
 * UN SEUL ÉCRAN, TROIS APPLICATIONS
 *
 * mAI, Vibe et Wakies avaient chacune leurs réglages de notification, dans
 * trois endroits différents. L'utilisateur devait savoir que Vibe avait les
 * siens, ailleurs, sur une autre page — et c'est une knowledge qu'on ne peut
 * pas supposer.
 *
 * L'écran est donc groupé par application, mais chaque groupe reste le SEUL
 * endroit où sa décision est prise :
 *
 *   - mAI     → `user_notification_prefs` (table de l'hôte) ;
 *   - Vibe    → `user_settings` (table du backend Vibe) ;
 *   - Wakies  → `WakiesSettings` (table de l'hôte).
 *
 * Les trois enregistrements sont INDÉPENDANTS : un échec Vibe ne doit pas
 * empêcher les préférences mAI d'être enregistrées, sinon une panne du
 * backend social verrouillerait les notifications de l'IA.
 *
 * ── Ce qui reste ailleurs ─────────────────────────────────────────────────
 *
 * La permission du navigateur et le haptique Vibe ne sont PAS ici :
 * ce sont des décisions d'APPAREIL, pas de compte. La permission se règle
 * depuis l'invite ou les réglages du navigateur ; le haptique reste dans les
 * paramètres Vibe.
 */

/** Les préférences mAI, dans le vocabulaire de l'écran. */
type MaiNotificationPreferences = {
  agentApprovalRequired: boolean;
  agentRunFailed: boolean;
  agentRunFinished: boolean;
  agentUserInputRequired: boolean;
  aiResponse: boolean;
  mcpAccessRequest: boolean;
  mcpCreated: boolean;
  news: boolean;
  planningTaskCompleted: boolean;
  projectCreated: boolean;
  quotaWarning: boolean;
};

const MAI_DEFAULTS: MaiNotificationPreferences = {
  agentApprovalRequired: true,
  agentRunFailed: true,
  agentRunFinished: true,
  agentUserInputRequired: true,
  aiResponse: true,
  mcpAccessRequest: true,
  mcpCreated: true,
  news: true,
  planningTaskCompleted: true,
  projectCreated: true,
  quotaWarning: true,
};

export function NotificationsTab() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<string>("default");

  // ── Préférences mAI ─────────────────────────────────────────────────────
  const [maiPrefs, setMaiPrefs] =
    useState<MaiNotificationPreferences>(MAI_DEFAULTS);

  // ── Préférences Vibe ────────────────────────────────────────────────────
  const [vibePrefs, setVibePrefs] = useState<VibeNotificationPreferences>(
    VIBE_NOTIFICATION_DEFAULTS
  );

  // ── Préférences Wakies ──────────────────────────────────────────────────
  const [wakiesReplyAlerts, setWakiesReplyAlerts] = useState(true);

  const { data: notifPrefsData, mutate: mutateNotifPrefs } = useSWR(
    "/api/notifications/preferences",
    fetcher,
    { dedupingInterval: 10_000 }
  );

  // Les réglages Vibe sont lus par l'API Vibe (le backend social), pas par
  // une route de l'hôte : c'est là que `user_settings` vit. La lecture passe
  // donc par `ApiService`, comme la page Vibe elle-même.
  const { data: vibeSettingsData } = useSWR(
    "notifications-vibe-settings",
    async () => {
      const reponse = await ApiService.getSettings();
      return reponse?.settings ?? null;
    },
    { dedupingInterval: 30_000, shouldRetryOnError: false }
  );

  // Les réglages Wakies sont servis par la route de l'hôte.
  const { data: wakiesSettingsData } = useSWR("/api/wakies/settings", fetcher, {
    dedupingInterval: 30_000,
    shouldRetryOnError: false,
  });

  useEffect(() => {
    if (!notifPrefsData) {
      return;
    }
    const lu = <K extends keyof MaiNotificationPreferences>(
      cle: K,
      defaut: boolean
    ): boolean => {
      const valeur = notifPrefsData[cle as string];
      return typeof valeur === "boolean" ? valeur : defaut;
    };
    setMaiPrefs({
      agentApprovalRequired: lu("agentApprovalRequired", true),
      agentRunFailed: lu("agentRunFailed", true),
      agentRunFinished: lu("agentRunFinished", true),
      agentUserInputRequired: lu("agentUserInputRequired", true),
      aiResponse: lu("aiResponse", true),
      mcpAccessRequest: lu("mcpAccessRequest", true),
      mcpCreated: lu("mcpCreated", true),
      news: lu("news", true),
      planningTaskCompleted: lu("planningTaskCompleted", true),
      projectCreated: lu("projectCreated", true),
      quotaWarning: lu("quotaWarning", true),
    });
    if (typeof notifPrefsData.enabled === "boolean") {
      setNotifEnabled(notifPrefsData.enabled);
    }
  }, [notifPrefsData]);

  useEffect(() => {
    if (vibeSettingsData) {
      setVibePrefs(readVibeNotificationPreferences(vibeSettingsData));
    }
  }, [vibeSettingsData]);

  useEffect(() => {
    const settings = wakiesSettingsData?.settings;
    if (settings && typeof settings.replyAlertsEnabled === "boolean") {
      setWakiesReplyAlerts(settings.replyAlertsEnabled);
    }
  }, [wakiesSettingsData]);

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

  /**
   * Enregistre les trois applications, une par une.
   *
   * Chaque appel est encapsulé : un échec ne doit pas annuler les autres.
   * Le résultat est dit honestly — l'utilisateur sait ce qui a été
   * enregistré et ce qui ne l'a pas été.
   */
  const handleSaveNotifPrefs = useCallback(async () => {
    setIsSavingNotif(true);
    const echecs: string[] = [];

    // 1. mAI — la table de l'hôte.
    try {
      const res = await fetch("/api/notifications/preferences", {
        body: JSON.stringify({ enabled: notifEnabled, ...maiPrefs }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Erreur sauvegarde");
      }
      await mutateNotifPrefs();
    } catch (e: any) {
      echecs.push("mAI");
      console.error("[notifications] échec de l'enregistrement mAI:", e);
    }

    // 2. Vibe — la table du backend social.
    try {
      await ApiService.updateSettings(toVibeNotificationPayload(vibePrefs));
    } catch (e: any) {
      echecs.push("Vibe");
      console.error("[notifications] échec de l'enregistrement Vibe:", e);
    }

    // 3. Wakies — la table de l'hôte.
    try {
      const res = await fetch("/api/wakies/settings", {
        body: JSON.stringify({ replyAlertsEnabled: wakiesReplyAlerts }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Erreur sauvegarde");
      }
    } catch (e: any) {
      echecs.push("Wakies");
      console.error("[notifications] échec de l'enregistrement Wakies:", e);
    }

    if (echecs.length === 0) {
      toast.success("Préférences de notifications enregistrées !");
    } else {
      toast.error(
        `Enregistrement partiel : ${echecs.join(", ")} n'a pas été enregistré.`
      );
    }

    if (
      notifEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      handleRequestNotificationPermission();
    }
    setIsSavingNotif(false);
  }, [
    maiPrefs,
    mutateNotifPrefs,
    notifEnabled,
    handleRequestNotificationPermission,
    vibePrefs,
    wakiesReplyAlerts,
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
              Gérez l'envoi et la personnalisation de vos notifications, pour
              mAI, Vibe et Wakies.
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

        {/* Toggle global — ne concerne QUE mAI */}
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Activer les notifications mAI
            </span>
            <span className="text-xs text-muted-foreground">
              Ce réglage active ou coupe les notifications de mAI. Les
              actualités mAI sont activées par défaut. Les notifications de Vibe
              et de Wakies se règlent plus bas.
            </span>
          </div>
          <input
            checked={notifEnabled}
            className="size-5 shrink-0 accent-primary"
            onChange={(e) => {
              const v = e.target.checked;
              setNotifEnabled(v);
              if (v) setMaiPrefs((actuelles) => ({ ...actuelles, news: true }));
            }}
            type="checkbox"
          />
        </label>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* GROUPE mAI */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div
          className={`flex flex-col gap-3 pt-3 border-t border-border/40 scroll-mt-6 ${
            notifEnabled ? "" : "opacity-50 pointer-events-none"
          }`}
          id="notif-mai"
        >
          <div className="flex items-center gap-2">
            <BotIcon className="size-3.5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              mAI
            </p>
          </div>
          {[
            {
              desc: "À chaque réponse de l'IA dans vos conversations",
              key: "aiResponse" as const,
              label: "Réponse de l'IA",
            },
            {
              desc: "Lorsque l'Agent a terminé sa tâche",
              key: "agentRunFinished" as const,
              label: "Agent terminé",
            },
            {
              desc: "Lorsqu'un outil de l'Agent demande votre accord",
              key: "agentApprovalRequired" as const,
              label: "Approbation d'outil demandée",
            },
            {
              desc: "Lorsqu'un Agent attend une information de votre part",
              key: "agentUserInputRequired" as const,
              label: "Agent en attente de votre réponse",
            },
            {
              desc: "Lorsqu'un run d'Agent échoue",
              key: "agentRunFailed" as const,
              label: "Échec d'Agent",
            },
            {
              desc: "Lors de la création d'un nouveau dossier/projet",
              key: "projectCreated" as const,
              label: "Nouveau projet",
            },
            {
              desc: "Lors de l'ajout d'un nouveau serveur MCP",
              key: "mcpCreated" as const,
              label: "Nouveau MCP",
            },
            {
              desc: "Lorsqu'un outil MCP demande une autorisation d'écriture ou d'exécution",
              key: "mcpAccessRequest" as const,
              label: "Demande d'accès MCP",
            },
            {
              desc: "Actualités et annonces mAI (via admin, activé par défaut si notifications on)",
              key: "news" as const,
              label: "Actualités mAI",
            },
            {
              desc: "Lorsqu'une tâche de planification automatique se termine avec succès",
              key: "planningTaskCompleted" as const,
              label: "Tâche planifiée terminée",
            },
            {
              desc: "Alerte en cas d'atteinte de 90% ou 100% de votre quota mAI",
              key: "quotaWarning" as const,
              label: "Alerte de quota",
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
                checked={maiPrefs[item.key]}
                className="size-4 shrink-0 accent-primary"
                disabled={!notifEnabled}
                onChange={(e) =>
                  setMaiPrefs((actuelles) => ({
                    ...actuelles,
                    [item.key]: e.target.checked,
                  }))
                }
                type="checkbox"
              />
            </label>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* GROUPE VIBE */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div
          className="flex flex-col gap-3 pt-3 border-t border-border/40 scroll-mt-6"
          id="notif-vibe"
        >
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-3.5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vibe
            </p>
          </div>
          {[
            {
              desc: "J'aime et réactions sur vos publications",
              key: "likes" as const,
              label: "J'aime",
            },
            {
              desc: "Partages de vos publications",
              key: "reposts" as const,
              label: "Partages",
            },
            {
              desc: "Réponses, citations et mentions",
              key: "replies" as const,
              label: "Réponses et mentions",
            },
            {
              desc: "Messages privés reçus",
              key: "directMessages" as const,
              label: "Messages privés",
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
                checked={vibePrefs[item.key]}
                className="size-4 shrink-0 accent-primary"
                onChange={(e) =>
                  setVibePrefs((actuelles) => ({
                    ...actuelles,
                    [item.key]: e.target.checked,
                  }))
                }
                type="checkbox"
              />
            </label>
          ))}
          <p className="text-[11px] text-muted-foreground">
            Le retour haptique et les animations Vibe restent dans les{" "}
            <a className="text-primary underline" href="/vibe/settings">
              paramètres Vibe
            </a>{" "}
            : ce sont des réglages d'appareil, pas de compte.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* GROUPE WAKIES */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div
          className="flex flex-col gap-3 pt-3 border-t border-border/40 scroll-mt-6"
          id="notif-wakies"
        >
          <div className="flex items-center gap-2">
            <BotIcon className="size-3.5 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Wakies
            </p>
          </div>
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/30 cursor-pointer">
            <div className="flex flex-col pr-3">
              <span className="text-sm font-medium text-foreground">
                Alertes de réponses terminées
              </span>
              <span className="text-xs text-muted-foreground">
                Lorsqu'un de vos Wakies termine une réponse
              </span>
            </div>
            <input
              checked={wakiesReplyAlerts}
              className="size-4 shrink-0 accent-primary"
              onChange={(e) => setWakiesReplyAlerts(e.target.checked)}
              type="checkbox"
            />
          </label>
          <p className="text-[11px] text-muted-foreground">
            La sourdine se règle fil par fil, dans l'en-tête de la conversation
            : c'est une préférence du fil, pas du compte.
          </p>
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
            ) : (
              <CheckIcon className="size-4" />
            )}
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
