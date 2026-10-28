"use client";

import {
  AlertTriangleIcon,
  CheckIcon,
  CircleCheckIcon,
  DatabaseIcon,
  Globe2Icon,
  InfoIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  LogInIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UnlinkIcon,
} from "@mdevs/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IntegrationLogo } from "@/lib/integrations/logo";
import { getIntegrationByPluginId } from "@/lib/integrations/providers";
import type { IntegrationStatus } from "@/lib/integrations/status";
import { getCategoryLabel } from "@/lib/plugins/catalog";
import { PluginIcon } from "@/lib/plugins/icon";
import type { PluginManifest } from "@/lib/plugins/types";
import { cn, fetcher } from "@/lib/utils";

function networkLabel(manifest: PluginManifest): string {
  if (manifest.permissions.network === "none") return "Aucun accès réseau";
  if (manifest.permissions.network === "read-write") {
    return "Accès réseau en lecture et écriture";
  }
  return "Accès réseau en lecture seule";
}

function riskLabel(manifest: PluginManifest): {
  label: string;
  tone: "low" | "medium" | "high";
} {
  if (manifest.permissions.writesUserData) {
    return { label: "Données sensibles", tone: "high" };
  }
  if (manifest.permissions.readsUserData) {
    return { label: "Données personnelles", tone: "medium" };
  }
  return { label: "Accès limité", tone: "low" };
}

type PermissionRow = {
  detail: string;
  icon: typeof CheckIcon;
  label: string;
  tone: "default" | "positive" | "warning" | "danger";
  value: string;
};

/**
 * Motifs de refus renvoyés par le callback, dits à l'utilisateur en français.
 * Chaque motif correspond à une sortie réelle de `callback/route.ts` — un motif
 * inconnu retombe sur une phrase générique plutôt que sur un silence.
 */
const OAUTH_FAILURE_MESSAGES: Record<string, string> = {
  exchange_failed:
    "Le fournisseur n'a pas reconnu ce code. Recommencez la connexion.",
  not_configured: `Ce connecteur n'est pas activé sur cette instance (identifiants d'application manquants).`,
  plan_required: "Le forfait actuel ne permet pas d'installer ce plugin.",
  provider_denied:
    "Connexion annulée : les accès demandés n'ont pas été accordés.",
  state_invalid:
    "Cette connexion a expiré ou a été entamée depuis un autre navigateur. Relancez-la.",
  tier_unavailable:
    "Impossible de vérifier votre forfait. Le compte externe n'a pas été installé ; vous pourrez réessayer.",
  vault_unconfigured:
    "Le coffre de secrets n'est pas configuré sur cette instance : les jetons ne peuvent être ni scellés ni stockés. La variable MCP_ENCRYPTION_KEY doit être posée côté serveur, puis l'application redémarrée.",
};

function permissionRows(manifest: PluginManifest): PermissionRow[] {
  const { permissions } = manifest;
  return [
    {
      detail:
        permissions.network === "none"
          ? "Le plugin ne contacte aucun service externe."
          : permissions.network === "read-write"
            ? "Le plugin peut modifier des données sur un service externe après approbation."
            : "Le plugin contacte un service externe en lecture seule.",
      icon: Globe2Icon,
      label: "Réseau",
      tone:
        permissions.network === "none"
          ? "positive"
          : permissions.network === "read-write"
            ? "danger"
            : "warning",
      value: networkLabel(manifest),
    },
    {
      detail: permissions.readsUserData
        ? "Les données demandées sont transmises au modèle pour traiter la tâche."
        : "Aucune donnée de votre compte n'est lue par ce plugin.",
      icon: DatabaseIcon,
      label: "Données du compte",
      tone: permissions.readsUserData ? "warning" : "positive",
      value: permissions.readsUserData ? "Lecture possible" : "Aucune lecture",
    },
    {
      detail: permissions.writesUserData
        ? "Une action modifie des données et nécessite une confirmation explicite."
        : "Le plugin ne modifie aucune donnée de votre compte.",
      icon: KeyRoundIcon,
      label: "Écriture",
      tone: permissions.writesUserData ? "danger" : "positive",
      value: permissions.writesUserData
        ? "Modification possible"
        : "Aucune écriture",
    },
    {
      detail: permissions.requiresApproval
        ? "Vous verrez une demande d'approbation avant chaque exécution sensible."
        : "Aucune confirmation n'est nécessaire pour ce plugin.",
      icon: ShieldCheckIcon,
      label: "Approbation",
      tone: permissions.requiresApproval ? "warning" : "positive",
      value: permissions.requiresApproval ? "Requise" : "Non requise",
    },
  ];
}

export default function PluginDetailClient({
  enabled,
  installed,
  installedVersion,
  locked,
  manifest,
  notice,
}: {
  enabled: boolean;
  installed: boolean;
  installedVersion: string | null;
  locked: boolean;
  manifest: PluginManifest;
  /** Issue du retour OAuth, passée par la page : une seule fois, puis effacée. */
  notice?: {
    account?: string;
    installation?: string;
    outcome?: string;
    provider?: string;
    reason?: string;
  };
}) {
  const { mutate: mutatePlugins } = useSWRConfig();
  const [isBusy, setIsBusy] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [isTokenFormOpen, setIsTokenFormOpen] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [state, setState] = useState({ enabled, installed, installedVersion });
  const risk = riskLabel(manifest);
  const permissions = permissionRows(manifest);

  // Un connecteur est un plugin comme un autre, avec une étape de plus : le
  // compte externe. Le descripteur est dérivé du manifeste, jamais dupliqué.
  const connector = useMemo(
    () => getIntegrationByPluginId(manifest.id),
    [manifest.id]
  );
  const {
    data: integrationData,
    error: integrationError,
    isLoading: isIntegrationLoading,
    mutate: mutateIntegrations,
  } = useSWR<{
    integrations: IntegrationStatus[];
  }>(connector ? "/api/integration" : null, fetcher);
  const connection = integrationData?.integrations?.find(
    (item) => item.pluginId === manifest.id
  );
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  // Un connecteur à jeton personnel n'a pas d'écran de consentement : le
  // bouton « Connecter » ne doit pas renvoyer vers une route OAuth inexistante.
  const connectHref =
    connector?.authMode === "oauth"
      ? `${basePath}/api/integration/${connector.id}/connect?returnTo=${encodeURIComponent(
          `${basePath}/tools/plugins/${manifest.id}`
        )}`
      : null;
  const installConnectHref = connectHref
    ? `${connectHref}&intent=install`
    : null;

  // La navigation est un geste explicite : un bouton déclenche la même chose
  // qu'un lien, sans dépendre d'un `href` qui n'existe pas en mode jeton.
  const startConnection = useCallback(() => {
    if (connectHref) {
      window.location.assign(connectHref);
    }
  }, [connectHref]);

  const runAction = async (
    action: () => Promise<Response>,
    onSuccess: () => void | Promise<void>,
    successMessage: string
  ) => {
    setIsBusy(true);
    try {
      const response = await action();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Action impossible.");
      }
      await onSuccess();
      await mutatePlugins("/api/plugins");
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const refreshInstallations = useCallback(async () => {
    const response = await fetch("/api/plugins");
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as {
      plugins?: Array<{
        enabled: boolean;
        id: string;
        installed: boolean;
        installedVersion: string | null;
      }>;
    };
    const entry = payload.plugins?.find((p) => p.id === manifest.id);
    if (entry) {
      setState({
        enabled: entry.enabled,
        installed: entry.installed,
        installedVersion: entry.installedVersion,
      });
    }
  }, [manifest.id]);

  const handleInstall = () => {
    if (
      connector?.authMode === "oauth" &&
      !connection?.connected &&
      installConnectHref
    ) {
      // Sans coffre, la connexion ne peut pas aboutir : on ne renvoie pas
      // l'utilisateur vers l'écran de consentement pour un échec certain.
      if (!connection?.vaultConfigured) {
        toast.error(
          "Le coffre de secrets n'est pas configuré sur cette instance : la connexion externe est impossible pour le moment."
        );
        return;
      }
      setIsBusy(true);
      window.location.assign(installConnectHref);
      return;
    }
    runAction(
      () =>
        fetch("/api/plugins", {
          body: JSON.stringify({ pluginId: manifest.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      refreshInstallations,
      `${manifest.name} installé — mentionnez-le avec @${manifest.name} dans le chat.`
    );
  };

  const handleUninstall = () => {
    if (!confirmUninstall) {
      setConfirmUninstall(true);
      return;
    }
    runAction(
      () => fetch(`/api/plugins/${manifest.id}`, { method: "DELETE" }),
      () => {
        setConfirmUninstall(false);
        setState({ enabled: false, installed: false, installedVersion: null });
      },
      `${manifest.name} désinstallé.`
    );
  };

  const handleToggleEnabled = () => {
    runAction(
      () =>
        fetch(`/api/plugins/${manifest.id}`, {
          body: JSON.stringify({ isEnabled: !state.enabled }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      () => setState((prev) => ({ ...prev, enabled: !prev.enabled })),
      state.enabled ? `${manifest.name} désactivé.` : `${manifest.name} activé.`
    );
  };

  /**
   * Enregistrement d'un jeton personnel (Vercel). Le jeton part une seule fois
   * vers la route, qui le valide puis le chiffre : il n'est jamais renvoyé au
   * client, ni journalisé, ni conservé dans un état global.
   */
  const handleSaveToken = async () => {
    if (!connector?.token) {
      return;
    }
    const token = tokenDraft.trim();
    if (
      token.length < connector.token.minLength ||
      token.length > connector.token.maxLength
    ) {
      toast.error(
        `Le jeton doit contenir entre ${connector.token.minLength} et ${connector.token.maxLength} caractères.`
      );
      return;
    }
    setIsSavingToken(true);
    try {      const response = await fetch(
        `${basePath}/api/integration/${connector.id}/token`,
        {
        body: JSON.stringify({ token }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        accountLabel?: string;
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Jeton refusé.");
      }
      setTokenDraft("");
      await mutateIntegrations();
      toast.success(
        payload?.accountLabel
          ? `${connector.label} connecté : ${payload.accountLabel}`
          : `${connector.label} connecté.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Jeton refusé.");
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connector) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const response = await fetch(
        `${basePath}/api/integration/${connector.id}/disconnect`,
        { method: "POST" }
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Déconnexion impossible.");
      }
      toast.success(payload?.message ?? `${connector.label} déconnecté.`);
      await mutateIntegrations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Le callback revient par navigation, l'issue en query. On l'annonce une fois,
  // puis on rature l'URL : sinon chaque rafraîchissement rejouerait le toast, et
  // un lien collé dans un nouvel onglet annoncerait une connexion en cours.
  const consumedNotice = useRef<string | null>(null);
  useEffect(() => {
    const signature = notice?.outcome
      ? [
          notice.outcome,
          notice.provider ?? "",
          notice.reason ?? "",
          notice.installation ?? "",
        ].join("|")
      : null;
    if (!signature || consumedNotice.current === signature) {
      return;
    }
    consumedNotice.current = signature;

    const label = connector?.label ?? manifest.name;
    if (notice?.outcome === "connected") {
      if (notice.installation === "installed") {
        toast.success(
          `${label} connecté et ${manifest.name} installé — mentionnez-le avec @${manifest.name} dans le chat.`
        );
      } else {
        toast.success(
          `${label} connecté${notice.account ? ` — ${notice.account}` : ""}.`
        );
        if (notice.installation) {
          toast.error(
            notice.installation === "plan_required"
              ? OAUTH_FAILURE_MESSAGES.plan_required
              : notice.installation === "tier_unavailable"
                ? OAUTH_FAILURE_MESSAGES.tier_unavailable
                : "Le compte est connecté, mais le plugin n'a pas pu être installé. Réessayez depuis cette fiche.",
            { duration: 9000 }
          );
        }
      }
    } else if (notice?.outcome === "error") {
      toast.error(
        OAUTH_FAILURE_MESSAGES[notice.reason ?? ""] ??
          "La connexion a échoué pour une raison inattendue.",
        { duration: 9000 }
      );
    }

    const url = new URL(window.location.href);
    for (const name of [
      "integration",
      "provider",
      "account",
      "reason",
      "installation",
    ]) {
      url.searchParams.delete(name);
    }
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
    void mutateIntegrations();
    void mutatePlugins("/api/plugins");
    void refreshInstallations();
  }, [
    connector,
    manifest.name,
    mutateIntegrations,
    mutatePlugins,
    notice,
    refreshInstallations,
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
        <PageBackButton
          fallbackHref="/tools?tab=plugins"
          label="Retour aux plugins"
        />
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
            <PluginIcon className="size-5" icon={manifest.icon} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              {manifest.name}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Plugin · {getCategoryLabel(manifest.category)}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6 pb-28 sm:gap-8 sm:pb-8">
          <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  state.installed
                    ? state.enabled
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    state.enabled ? "bg-success" : "bg-muted-foreground"
                  )}
                />
                {state.enabled
                  ? "Activé"
                  : state.installed
                    ? "Installé (désactivé)"
                    : "Non installé"}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                v{state.installedVersion ?? manifest.version}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
                  locked
                    ? "bg-warning/10 text-warning"
                    : "bg-primary/10 text-primary"
                )}
              >
                {locked ? <LockIcon className="size-3" /> : null}
                {manifest.minTier}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  risk.tone === "high"
                    ? "bg-destructive/10 text-destructive"
                    : risk.tone === "medium"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success"
                )}
              >
                <ShieldCheckIcon className="size-3" />
                {risk.label}
              </span>
            </div>

            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {manifest.name}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
                {manifest.description}
              </p>
            </div>

            {locked ? (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-3 text-sm text-foreground">
                <LockIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  Installation réservée au forfait {manifest.minTier}. Le
                  serveur refusera toute installation avec un forfait inférieur.
                </p>
              </div>
            ) : null}
          </section>

          {/* ─── Connexion au compte externe ─────────────────────────────── */}
          {connector ? (
            <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 p-2">
                  <IntegrationLogo className="size-6" descriptor={connector} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold">
                    Compte {connector.label}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {connector.accessSummary}
                  </p>
                </div>
                {connection?.connected ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                    <CheckIcon className="size-3" />
                    Connecté
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    Non connecté
                  </span>
                )}
              </div>

              {/*
                L'état de connexion est une requête réseau : sans ce garde,
                la fiche affiche « Non connecté » et aucun bouton pendant le
                chargement — exactement le symptôme qui faisait croire à une
                configuration cassée. Un chargement se dit, il ne se tait pas.
              */}
              {isIntegrationLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  Chargement de l'état de connexion…
                </div>
              ) : null}

              {integrationError ? (
                <div
                  className="flex flex-col gap-2 rounded-2xl border border-destructive/25 bg-destructive/5 p-3 text-sm"
                  role="alert"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <AlertTriangleIcon className="size-4 text-destructive" />
                    Impossible de lire l'état des connexions.
                  </p>
                  <p className="text-muted-foreground leading-6">
                    La fiche ne peut pas savoir si le compte est relié. Vérifiez
                    la session, puis réessayez.
                  </p>
                  <div>
                    <Button
                      onClick={() => void mutateIntegrations()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <RefreshCwIcon className="size-4" />
                      Réessayer
                    </Button>
                  </div>
                </div>
              ) : null}

              {connection?.connected ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">Compte</span>
                    <span className="font-medium">
                      {connection.accountLabel ??
                        connection.accountEmail ??
                        "—"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">Autorités</span>
                    <span className="font-medium">
                      {connection.scopes.length} accordées
                    </span>
                  </div>
                  {connection.expiresAt ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-muted-foreground">
                        {connector.authMode === "token"
                          ? "Vérifié le"
                          : "Jeton renouvelable jusqu'au"}
                      </span>
                      <span className="font-medium">
                        {new Date(connection.expiresAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {connection && !connection.configured ? (
                <div className="flex flex-col gap-1 text-sm leading-6 text-muted-foreground">
                  <p>
                    Ce connecteur n'est pas activé sur cette instance : les
                    identifiants de l'application {connector.label} manquent
                    côté serveur.
                  </p>
                  {connection.missingEnv.length > 0 ? (
                    <p>
                      Variables manquantes :{" "}
                      <code className="font-mono text-xs text-foreground">
                        {connection.missingEnv.join(", ")}
                      </code>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {connection?.warnings.map((warning) => (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-3 text-sm"
                  key={warning}
                >
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p className="text-muted-foreground leading-6">{warning}</p>
                </div>
              ))}

              {/*
                Le coffre absent se voit ICI, avant le clic, et non dans un
                toast d'erreur : l'utilisateur n'a aucun moyen de corriger une
                variable d'environnement, et « Connecter » qui échoue sans
                raison lisible est pire que « Connecter » qui est désactivé avec
                la cause.
              */}
              {connection && !connection.vaultConfigured ? (
                <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/10 p-3 text-sm">
                  <LockIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      Coffre de secrets non configuré sur cette instance
                    </p>
                    <p className="text-muted-foreground leading-6">
                      Les jetons {connector.label} ne peuvent être ni scellés ni
                      stockés. L'administrateur doit poser la variable
                      d'environnement <code>MCP_ENCRYPTION_KEY</code> sur le
                      serveur, puis redémarrer l'application. Aucune connexion
                      n'est possible d'ici là.
                    </p>
                  </div>
                </div>
              ) : null}

              {connection?.connected && !connection.canWrite ? (
                <p className="text-sm leading-6 text-warning">
                  Les accès en écriture n'ont pas été accordés : la lecture
                  reste disponible, les actions d'écriture seront refusées.
                </p>
              ) : null}

              {connector.authMode === "oauth" ? (
                <div className="flex flex-wrap items-center gap-2">
                  {connection?.connected ? (
                    <>
                      <Button
                        disabled={isDisconnecting}
                        onClick={handleDisconnect}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {isDisconnecting ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <UnlinkIcon className="size-4" />
                        )}
                        Déconnecter
                      </Button>
                      <Button
                        onClick={startConnection}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <ShieldCheckIcon className="size-4" />
                        Mettre à jour les accès
                      </Button>
                      <Button
                        onClick={() => void mutateIntegrations()}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <RefreshCwIcon className="size-4" />
                        Réessayer
                      </Button>
                    </>
                  ) : connection === undefined ? (
                    /*
                      Un état INCONNU n'est pas un état « non connecté ». Le
                      dire explicitement évite de conclure à une panne de
                      configuration pendant une simple requête en vol.
                    */
                    <Button disabled size="sm" type="button">
                      <Loader2Icon className="size-4 animate-spin" />
                      Chargement…
                    </Button>
                  ) : connection.configured && connection.vaultConfigured ? (
                    <Button onClick={startConnection} size="sm" type="button">
                      <LogInIcon className="size-4" />
                      Connecter {connector.label}
                    </Button>
                  ) : (
                    <>
                      <Button disabled size="sm" type="button">
                        <AlertTriangleIcon className="size-4" />
                        Configuration incomplète
                      </Button>
                      <Button
                        onClick={() => void mutateIntegrations()}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <RefreshCwIcon className="size-4" />
                        Réessayer
                      </Button>
                    </>
                  )}
                </div>
              ) : null}

              {/*
                Un jeton personnel ne s'obtient pas par une redirection : sans
                ce formulaire, la fiche décrirait une connexion qu'aucun
                bouton ne permet. Il n'est proposé QUE si le coffre existe :
                stocker un jeton sans clé de chiffrement le laisserait en
                clair en base.
              */}
              {connector.authMode === "token" ? (
                connection?.connected ? (
                  <Button
                    disabled={isDisconnecting}
                    onClick={handleDisconnect}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {isDisconnecting ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <UnlinkIcon className="size-4" />
                    )}
                    Supprimer le jeton
                  </Button>
                ) : connection?.vaultConfigured ? (
                  isTokenFormOpen ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Coller un jeton personnel
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          Le jeton est validé chez {connector.label}, puis
                          chiffré sur le serveur. Il n'est jamais renvoyé au
                          navigateur ni écrit dans un journal.{" "}
                          <a
                            className="underline underline-offset-2"
                            href={connector.token?.helpUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Créer un jeton chez {connector.label}
                          </a>
                        </p>
                      </div>
                      {/* Un <form> plutôt qu'un bouton : Entrée doit enregistrer,
                        et le gestionnaire de mots de passe ne doit pas
                        s'inviter sur un champ de jeton. */}
                      <form
                        className="flex flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleSaveToken();
                        }}
                      >
                        <Input
                          autoComplete="off"
                          className="font-mono text-xs"
                          disabled={isSavingToken}
                          maxLength={connector.token?.maxLength}
                          onChange={(event) =>
                            setTokenDraft(event.target.value)
                          }
                          placeholder={connector.token?.placeholder}
                          spellCheck={false}
                          type="password"
                          value={tokenDraft}
                        />
                        <div className="flex gap-2">
                          <Button
                            disabled={isSavingToken || !tokenDraft.trim()}
                            size="sm"
                            type="submit"
                          >
                            {isSavingToken ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <KeyRoundIcon className="size-4" />
                            )}
                            Enregistrer
                          </Button>
                          <Button
                            disabled={isSavingToken}
                            onClick={() => {
                              setTokenDraft("");
                              setIsTokenFormOpen(false);
                            }}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            Annuler
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsTokenFormOpen(true)}
                      size="sm"
                      type="button"
                    >
                      <KeyRoundIcon className="size-4" />
                      Enregistrer un jeton
                    </Button>
                  )
                ) : null
              ) : null}

              {connection?.connected && connector.id === "github" ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  GitHub peut réutiliser l'autorisation existante si les droits
                  demandés n'ont pas changé. Une nouvelle demande sera affichée
                  lorsque les accès requis évoluent.
                </p>
              ) : null}

              <p className="text-xs leading-5 text-muted-foreground">
                Les actions qui modifient une donnée chez {connector.label} ne
                sont proposées que dans l'Agent, et chacune demande votre
                approbation avant de s'exécuter.
              </p>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Version disponible
              </p>
              <p className="mt-1 text-lg font-semibold">v{manifest.version}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Catégorie
              </p>
              <p className="mt-1 text-lg font-semibold">
                {getCategoryLabel(manifest.category)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Outils exposés
              </p>
              <p className="mt-1 text-lg font-semibold">
                {manifest.tools.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Auteur
              </p>
              <p className="mt-1 truncate text-lg font-semibold">
                {manifest.author}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold">Outils et capacités</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Agent ne peut utiliser que les outils listés ici, avec les
                permissions déclarées par le manifeste.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {manifest.tools.map((pluginTool) => (
                <article
                  className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4"
                  key={pluginTool.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <InfoIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{pluginTool.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {pluginTool.description}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 rounded-xl bg-muted/50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Identifiant
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-foreground">
                      {pluginTool.id}
                    </p>
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Instruction Agent
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                      {pluginTool.systemHint}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold">
                Permissions et sécurité
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ces informations proviennent du manifeste contrôlé par le
                serveur. Elles décrivent les capacités déclarées, pas les
                actions réellement choisies par le modèle.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              <div className="divide-y divide-border/50">
                {permissions.map((permission) => {
                  const Icon = permission.icon;
                  return (
                    <div
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4"
                      key={permission.label}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          permission.tone === "positive"
                            ? "bg-success/10 text-success"
                            : permission.tone === "danger"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-medium">{permission.label}</p>
                          <span className="text-xs text-muted-foreground">
                            {permission.value}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {permission.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Les outils qui modifient des données ou effectuent une action
                sensible restent bloqués tant que leur approbation n'a pas été
                accordée pour les paramètres exacts de l'appel.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <h2 className="text-sm font-semibold">Utilisation</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Mentionnez ce plugin dans le chat avec{" "}
                  <span className="font-semibold text-foreground">
                    @{manifest.name}
                  </span>{" "}
                  pour l'utiliser dans une tâche. Agent choisira l'outil adapté
                  à votre demande et appliquera les permissions ci-dessus.
                </p>
              </div>
            </div>
          </section>

          {manifest.tags.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">Mots-clés</h2>
              <div className="flex flex-wrap gap-1.5">
                {manifest.tags.map((tag) => (
                  <span
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {confirmUninstall ? (
            <div
              aria-live="polite"
              className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p>
                  Désinstaller {manifest.name} ? Les outils de ce plugin ne
                  seront plus proposés dans les prochaines conversations.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  disabled={isBusy}
                  onClick={() => setConfirmUninstall(false)}
                  size="sm"
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button
                  disabled={isBusy}
                  onClick={handleUninstall}
                  size="sm"
                  variant="destructive"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <div className="sticky bottom-0 z-20 border-t border-border/50 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md sm:static sm:px-6 sm:pb-0 sm:pt-0">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-end gap-2">
          {state.installed ? (
            <>
              <Button
                disabled={isBusy || (locked && !state.enabled)}
                onClick={handleToggleEnabled}
                title={
                  locked && !state.enabled
                    ? `Forfait ${manifest.minTier} requis pour réactiver ce plugin.`
                    : undefined
                }
                type="button"
                variant="outline"
              >
                {isBusy ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <CheckIcon
                    className={cn(
                      "size-4",
                      state.enabled ? "text-success" : "text-muted-foreground"
                    )}
                  />
                )}
                {state.enabled ? "Désactiver" : "Activer"}
              </Button>
              <Button
                disabled={isBusy}
                onClick={handleUninstall}
                type="button"
                variant="destructive"
              >
                {isBusy ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
                Désinstaller
              </Button>
            </>
          ) : (
            <Button
              disabled={
                isBusy || locked || Boolean(connector && isIntegrationLoading)
              }
              onClick={handleInstall}
              title={
                locked
                  ? `Forfait ${manifest.minTier} requis pour installer ce plugin.`
                  : undefined
              }
              type="button"
            >
              {isBusy ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : locked ? (
                <LockIcon className="size-4" />
              ) : (
                <PlusIcon className="size-4" />
              )}
              Installer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
