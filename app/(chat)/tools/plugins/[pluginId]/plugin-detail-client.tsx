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
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/plugins/catalog";
import { PluginIcon } from "@/lib/plugins/icon";
import type { PluginManifest } from "@/lib/plugins/types";
import { cn } from "@/lib/utils";

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
}: {
  enabled: boolean;
  installed: boolean;
  installedVersion: string | null;
  locked: boolean;
  manifest: PluginManifest;
}) {
  const { mutate: mutatePlugins } = useSWRConfig();
  const [isBusy, setIsBusy] = useState(false);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [state, setState] = useState({ enabled, installed, installedVersion });
  const risk = riskLabel(manifest);
  const permissions = permissionRows(manifest);

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

  const refreshInstallations = async () => {
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
  };

  const handleInstall = () => {
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
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    state.enabled ? "bg-emerald-500" : "bg-muted-foreground"
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
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
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
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : risk.tone === "medium"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
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
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                <LockIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  Installation réservée au forfait {manifest.minTier}. Le
                  serveur refusera toute installation avec un forfait inférieur.
                </p>
              </div>
            ) : null}
          </section>

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
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : permission.tone === "danger"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
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
              <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
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
                      state.enabled
                        ? "text-emerald-500"
                        : "text-muted-foreground"
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
              disabled={isBusy || locked}
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
