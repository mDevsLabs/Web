"use client";

import { CheckIcon, Loader2Icon, PlusIcon, Trash2Icon } from "@mdevs/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { getIntegrationByPluginId } from "@/lib/integrations/providers";
import type { IntegrationStatus } from "@/lib/integrations/status";
import { PLUGIN_CATEGORIES } from "@/lib/plugins/core/catalog";
import { PluginIcon } from "@/lib/plugins/core/icon";
import type { PluginCatalogEntry } from "@/lib/plugins/core/types";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { TOOLS_ACTIONS_ID } from "@/lib/tools/tabs";
import { confirmInApp } from "@/lib/ui/app-dialog";
import { cn, fetcher } from "@/lib/utils";
import { PersonalPlugins } from "./personal-plugins";

type PluginsResponse = { plugins: PluginCatalogEntry[] };
type IntegrationsResponse = { integrations: IntegrationStatus[] };
type AccessFilter = "all" | "instant" | "token";

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
  const { data: integrationData, isLoading: isIntegrationLoading } =
    useSWR<IntegrationsResponse>("/api/integration", fetcher);
  const connectedByPlugin = useMemo(() => {
    const map = new Map<string, IntegrationStatus>();
    for (const item of integrationData?.integrations ?? []) {
      map.set(item.pluginId, item);
    }
    return map;
  }, [integrationData]);
  const plugins = useMemo(() => data?.plugins ?? [], [data]);
  const [category, setCategory] = useState<string | null>(null);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [busyPluginId, setBusyPluginId] = useState<string | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setActionsAnchor(document.getElementById(TOOLS_ACTIONS_ID));
  }, []);

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
    const connector = getIntegrationByPluginId(plugin.id);
    const connection = connectedByPlugin.get(plugin.id);
    if (connector && !connection?.connected) {
      router.push(`/tools/plugins/${plugin.id}`);
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

  const handleUninstall = async (plugin: PluginCatalogEntry) => {
    if (
      !(await confirmInApp(
        `Désinstaller ${plugin.name} ? Cette action est définitive sur cet appareil.`
      ))
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

  const openPluginPage = (plugin: PluginCatalogEntry) => {
    router.push(`/tools/plugins/${plugin.id}`);
  };

  const filtered = useMemo(() => {
    const matching = entries.filter((plugin) => {
      if (category && plugin.category !== category) {
        return false;
      }
      const hasConnector = Boolean(getIntegrationByPluginId(plugin.id));
      if (accessFilter === "instant" && hasConnector) {
        return false;
      }
      if (accessFilter === "token" && !hasConnector) {
        return false;
      }
      return matchesQuery(searchQuery, {
        primary: plugin.name,
        secondary: [
          plugin.description,
          plugin.tools.map((tool) => tool.label).join(", "),
        ],
        tags: plugin.tags,
      });
    });
    return sortByRelevance(matching, searchQuery, (plugin) => ({
      primary: plugin.name,
      secondary: [
        plugin.description,
        plugin.tools.map((tool) => tool.label).join(", "),
      ],
      tags: plugin.tags,
    }));
  }, [entries, searchQuery, category, accessFilter]);

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
      {actionsAnchor
        ? createPortal(
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-11 gap-1.5 text-xs font-medium sm:h-8"
                onClick={() => router.push("/tools/plugins/custom/new")}
                type="button"
              >
                <PlusIcon className="size-3.5" />
                Nouveau plugin
              </Button>
            </div>,
            actionsAnchor
          )
        : null}

      <PersonalPlugins searchQuery={searchQuery} />

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

      {/* Filtres : mode d'accès + catégories métier */}
      <section className="flex flex-col gap-3">
        <div
          aria-label="Mode d'accès"
          className="flex flex-wrap items-center gap-2"
        >
          {(
            [
              { id: "all", label: "Tous les accès" },
              { id: "instant", label: "Sans clé (prêts à l'emploi)" },
              { id: "token", label: "Avec jeton personnel" },
            ] as const
          ).map((mode) => (
            <button
              aria-pressed={accessFilter === mode.id}
              className={cn(
                "min-h-9 shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                accessFilter === mode.id
                  ? "border-foreground/30 bg-foreground/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
              key={mode.id}
              onClick={() => setAccessFilter(mode.id)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div
          aria-label="Catégories de plugins"
          className="flex max-w-full items-center gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0"
        >
          <button
            aria-pressed={category === null}
            className={cn(
              "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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
              aria-pressed={category === cat.id}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap min-h-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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
        </div>
      </section>

      {/* Catalogue */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Tous les plugins
          </h3>
          <span className="text-xs text-muted-foreground">
            {filtered.length} disponible{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun plugin ne correspond à votre recherche.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((plugin) => {
              const isBusy = busyPluginId === plugin.id;
              const connector = connectedByPlugin.get(plugin.id);
              const connectorDescriptor = getIntegrationByPluginId(plugin.id);
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
                      {connector ? (
                        <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              connector.connected
                                ? "bg-success"
                                : "bg-muted-foreground/40"
                            )}
                          />
                          {connector.connected
                            ? `Connecté${connector.accountLabel ? ` — ${connector.accountLabel}` : ""}`
                            : "Jeton personnel requis"}
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-success/70" />
                          Sans clé · {plugin.tools.length} outil
                          {plugin.tools.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                  </button>
                  {plugin.installed ? (
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
                              ? "text-success"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="size-9 shrink-0 rounded-full"
                      disabled={
                        isBusy ||
                        Boolean(connectorDescriptor && isIntegrationLoading)
                      }
                      onClick={() => handleInstall(plugin)}
                      title={
                        connectorDescriptor && !connector?.connected
                          ? `Configurer le jeton ${connectorDescriptor.label}`
                          : "Installer"
                      }
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
