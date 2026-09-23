"use client";

import {
  CheckIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/plugins/catalog";
import { PluginIcon } from "@/lib/plugins/icon";
import type { PluginManifest } from "@/lib/plugins/types";
import { cn } from "@/lib/utils";

// Vue dédiée d'un plugin (page, pas de fenêtre contextuelle) : toutes les
// informations du manifeste avec les actions installer / activer-désactiver /
// désinstaller.
// Libellés lisibles des permissions déclarées par le manifeste.
function permissionLabels(manifest: PluginManifest): string[] {
  const { permissions } = manifest;
  return [
    permissions.network === "none"
      ? "Aucun accès réseau"
      : "Accès réseau en lecture seule",
    permissions.readsUserData
      ? "Lit des données de votre compte"
      : "Ne lit aucune donnée de votre compte",
    permissions.writesUserData
      ? "Modifie des données de votre compte"
      : "N'écrit aucune donnée de votre compte",
    permissions.requiresApproval
      ? "Approbation explicite requise à chaque exécution"
      : "Aucune approbation nécessaire (lecture ou calcul local)",
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
  const [isBusy, setIsBusy] = useState(false);
  const [state, setState] = useState({ enabled, installed, installedVersion });

  const runAction = async (
    action: () => Promise<Response>,
    onSuccess: () => void,
    successMessage: string
  ) => {
    setIsBusy(true);
    try {
      const response = await action();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Action impossible.");
      }
      onSuccess();
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
    runAction(
      () => fetch(`/api/plugins/${manifest.id}`, { method: "DELETE" }),
      () =>
        setState({ enabled: false, installed: false, installedVersion: null }),
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
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-4 sm:px-6">
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

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* État */}
          <div className="flex flex-wrap items-center gap-2">
            {state.installed ? (
              <>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    state.enabled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      state.enabled ? "bg-emerald-500" : "bg-muted-foreground"
                    )}
                  />
                  {state.enabled ? "Activé" : "Installé (désactivé)"}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  v{state.installedVersion ?? manifest.version}
                </span>
              </>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Non installé
              </span>
            )}
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
            {locked ? (
              <span className="text-[11px] text-muted-foreground">
                Installation réservée au forfait {manifest.minTier} — le serveur
                refuse toute autre installation.
              </span>
            ) : null}
          </div>

          {/* Description */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {manifest.description}
            </p>
          </section>

          {/* Informations */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Informations
            </h2>
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Version disponible</dt>
              <dd className="font-medium text-foreground">
                v{manifest.version}
              </dd>
              <dt className="text-muted-foreground">Catégorie</dt>
              <dd className="font-medium text-foreground">
                {getCategoryLabel(manifest.category)}
              </dd>
              <dt className="self-start text-muted-foreground">Outils</dt>
              <dd className="flex flex-col gap-2 font-medium text-foreground">
                {manifest.tools.map((pluginTool) => (
                  <div className="flex flex-col" key={pluginTool.id}>
                    <span>{pluginTool.label}</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      {pluginTool.description}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {pluginTool.id}
                    </span>
                  </div>
                ))}
              </dd>
              <dt className="text-muted-foreground">Auteur</dt>
              <dd className="font-medium text-foreground">{manifest.author}</dd>
            </dl>
          </section>

          {/* Permissions déclarées */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Permissions
            </h2>
            <ul className="flex flex-col gap-1.5">
              {permissionLabels(manifest).map((label) => (
                <li
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                  key={label}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          {/* Tags */}
          {manifest.tags.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-foreground">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {manifest.tags.map((tag) => (
                  <span
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Utilisation */}
          <section className="rounded-2xl border border-border/50 bg-muted/20 p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Mentionnez ce plugin dans le chat avec{" "}
              <span className="font-semibold text-foreground">
                @{manifest.name}
              </span>{" "}
              pour l'utiliser au prochain message.
            </p>
          </section>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
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
      </main>
    </div>
  );
}
