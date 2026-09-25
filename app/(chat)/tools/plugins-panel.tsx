"use client";

import {
  CheckIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLUGIN_CATEGORIES } from "@/lib/plugins/catalog";
import { PluginIcon } from "@/lib/plugins/icon";
import type { PluginCatalogEntry } from "@/lib/plugins/types";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { cn, fetcher } from "@/lib/utils";

type PluginsResponse = { plugins: PluginCatalogEntry[] };

export default function PluginsPanel({
  searchQuery = "",
}: {
  searchQuery?: string;
}) {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<PluginsResponse>(
    "/api/plugins",
    fetcher
  );
  const plugins = useMemo(() => data?.plugins ?? [], [data]);
  const [category, setCategory] = useState<string | null>(null);
  const [busyPluginId, setBusyPluginId] = useState<string | null>(null);
  // Rangée d'actions globale : on y porte le bouton « Gérer le catalogue ».
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
  }, []);

  // `GET /api/plugins` renvoie déjà le catalogue complet (manifestes + état
  // d'installation + verrou de forfait) : aucune fusion locale à refaire, une
  // seule logique de catalogue.
  const entries: PluginCatalogEntry[] = plugins;

  const installed = entries.filter((p) => p.installed);

  async function runAction(
    pluginId: string,
    action: () => Promise<Response>,
    successMessage: string
  ) {
    setBusyPluginId(pluginId);
    try {
      const response = await action();
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Action impossible.");
      }
      await mutate();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setBusyPluginId(null);
    }
  }

  const handleInstall = (plugin: PluginCatalogEntry) => {
    if (plugin.installed) {
      return;
    }
    runAction(
      plugin.id,
      () =>
        fetch("/api/plugins", {
          body: JSON.stringify({ pluginId: plugin.id }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      `${plugin.name} installé — mentionnez-le avec @${plugin.name} dans le chat.`
    );
  };

  const handleUninstall = (plugin: PluginCatalogEntry) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Désinstaller ${plugin.name} ? Cette action est définitive sur cet appareil.`
      )
    ) {
      return;
    }
    runAction(
      plugin.id,
      () => fetch(`/api/plugins/${plugin.id}`, { method: "DELETE" }),
      `${plugin.name} désinstallé.`
    );
  };

  const handleToggleEnabled = (plugin: PluginCatalogEntry) => {
    runAction(
      plugin.id,
      () =>
        fetch(`/api/plugins/${plugin.id}`, {
          body: JSON.stringify({ isEnabled: !plugin.enabled }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }),
      plugin.enabled ? `${plugin.name} désactivé.` : `${plugin.name} activé.`
    );
  };

  // Le clic sur une vignette ouvre la page dédiée du plugin (version,
  // description, actions) — plus aucune fenêtre contextuelle ici.
  const openPluginPage = (plugin: PluginCatalogEntry) => {
    router.push(`/tools/plugins/${plugin.id}`);
  };

  // Recherche globale : filtrage par catégorie + correspondance, puis tri par
  // pertinence (nom > description > tags) et alphabétiquement.
  const filtered = useMemo(() => {
    const matching = entries.filter(
      (plugin) =>
        (!category || plugin.category === category) &&
        matchesQuery(searchQuery, {
          primary: plugin.name,
          secondary: [
            plugin.description,
            plugin.tools.map((tool) => tool.label).join(", "),
          ],
          tags: plugin.tags,
        })
    );
    return sortByRelevance(matching, searchQuery, (plugin) => ({
      primary: plugin.name,
      secondary: [
        plugin.description,
        plugin.tools.map((tool) => tool.label).join(", "),
      ],
      tags: plugin.tags,
    }));
  }, [entries, searchQuery, category]);

  const sortedInstalled = useMemo(
    () =>
      sortByRelevance(installed, searchQuery, (plugin) => ({
        primary: plugin.name,
        secondary: [
          plugin.description,
          plugin.tools.map((tool) => tool.label).join(", "),
        ],
        tags: plugin.tags,
      })),
    [installed, searchQuery]
  );

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Rangée d'actions globale (recherche dans l'en-tête de la page). */}
      {actionsAnchor
        ? createPortal(
            <div className="flex items-center gap-2">
              <Button
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => router.push("/tools?tab=plugins")}
                variant="outline"
              >
                Gérer le catalogue
              </Button>
            </div>,
            actionsAnchor
          )
        : null}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Chargement du catalogue…
        </div>
      ) : null}

      {/* Installés */}
      {installed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Installés</h3>
          <div className="flex flex-wrap items-center gap-3">
            {sortedInstalled.map((plugin) => {
              const isBusy = busyPluginId === plugin.id;
              return (
                <div className="group relative" key={plugin.id}>
                  <button
                    className={cn(
                      "flex size-12 min-h-11 min-w-11 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer",
                      !plugin.enabled && "opacity-45"
                    )}
                    onClick={() => openPluginPage(plugin)}
                    title={`${plugin.name} — voir la page du plugin`}
                    type="button"
                  >
                    <PluginIcon className="size-6" icon={plugin.icon} />
                  </button>
                  {/* Action tactile visible sur mobile ; sur desktop, la fiche plugin expose la même action. */}
                  <button
                    aria-label={`Désinstaller ${plugin.name}`}
                    className="absolute -top-2 -right-2 z-10 flex size-8 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer sm:hidden"
                    disabled={isBusy}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUninstall(plugin);
                    }}
                    title={`Désinstaller ${plugin.name}`}
                    type="button"
                  >
                    {isBusy ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Catégories */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          className={cn(
            "min-h-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            category === null
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setCategory(null)}
          type="button"
        >
          Toutes
        </button>
        {PLUGIN_CATEGORIES.map((cat) => (
          <button
            className={cn(
              "flex items-center gap-1.5 min-h-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              category === cat.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            type="button"
          >
            <PluginIcon
              className="size-3.5"
              icon={{ name: cat.icon, type: "lucide" }}
            />
            {cat.label}
          </button>
        ))}
      </section>

      {/* Catalogue */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Tous les plugins
        </h3>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun plugin ne correspond à votre recherche.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((plugin) => {
              const isBusy = busyPluginId === plugin.id;
              return (
                <div
                  className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border/50 hover:bg-muted/30"
                  key={plugin.id}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
                    onClick={() => openPluginPage(plugin)}
                    title={`${plugin.name} — voir la page du plugin`}
                    type="button"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
                      <PluginIcon className="size-5" icon={plugin.icon} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {plugin.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {plugin.description}
                      </span>
                    </span>
                  </button>
                  {plugin.locked ? (
                    <span
                      className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
                      title={`Réservé au forfait ${plugin.minTier} : l'installation est refusée par le serveur.`}
                    >
                      <LockIcon className="size-3" />
                      {plugin.minTier.toUpperCase()}
                    </span>
                  ) : plugin.installed ? (
                    <Button
                      className="size-9 shrink-0 rounded-full"
                      disabled={isBusy}
                      onClick={() => handleToggleEnabled(plugin)}
                      title={plugin.enabled ? "Désactiver" : "Activer"}
                      variant="outline"
                    >
                      {isBusy ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckIcon
                          className={cn(
                            "size-4",
                            plugin.enabled
                              ? "text-emerald-500"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="size-9 shrink-0 rounded-full"
                      disabled={isBusy}
                      onClick={() => handleInstall(plugin)}
                      title="Installer"
                      variant="ghost"
                    >
                      {isBusy ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <PlusIcon className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
