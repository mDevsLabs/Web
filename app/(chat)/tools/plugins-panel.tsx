"use client";

import {
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  filterPlugins,
  PLUGIN_CATEGORIES,
  PLUGIN_MANIFEST_LIST,
} from "@/lib/plugins/catalog";
import { PluginIcon } from "@/lib/plugins/icon";
import type { PluginCatalogEntry } from "@/lib/plugins/types";
import { cn, fetcher } from "@/lib/utils";

type PluginsResponse = { plugins: PluginCatalogEntry[] };

export default function PluginsPanel() {
  const { data, isLoading, mutate } = useSWR<PluginsResponse>(
    "/api/plugins",
    fetcher
  );
  const plugins = useMemo(() => data?.plugins ?? [], [data]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [busyPluginId, setBusyPluginId] = useState<string | null>(null);
  const [details, setDetails] = useState<PluginCatalogEntry | null>(null);

  // Le catalogue de la page est le manifeste statique enrichi de l'état
  // d'installation renvoyé par l'API.
  const merged = useMemo(() => {
    const byId = new Map(plugins.map((p) => [p.id, p]));
    return PLUGIN_MANIFEST_LIST.map(
      (manifest): PluginCatalogEntry => ({
        ...(byId.get(manifest.id) ?? {
          ...manifest,
          enabled: false,
          installed: false,
          installedVersion: null,
          updateAvailable: false,
        }),
      })
    );
  }, [plugins]);

  const installed = merged.filter((p) => p.installed);
  const filtered = filterPlugins(merged, search, category);

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

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Plugins
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Utilisez mAI dans vos outils préférés.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-full border-border/60 bg-muted/30 pl-9 text-sm"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher des plugins"
            value={search}
          />
        </div>
      </div>

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
            {installed.map((plugin) => (
              <button
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm transition hover:scale-105 cursor-pointer",
                  !plugin.enabled && "opacity-45"
                )}
                key={plugin.id}
                onClick={() => setDetails(plugin)}
                title={`${plugin.name} — ${plugin.enabled ? "activé" : "désactivé"}`}
                type="button"
              >
                <PluginIcon className="size-6" icon={plugin.icon} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Catégories */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm cursor-pointer"
                    onClick={() => setDetails(plugin)}
                    type="button"
                  >
                    <PluginIcon className="size-5" icon={plugin.icon} />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {plugin.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {plugin.description}
                    </span>
                  </div>
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

      {/* Détails d'un plugin */}
      <Dialog
        onOpenChange={(open) => !open && setDetails(null)}
        open={Boolean(details)}
      >
        <DialogContent className="sm:max-w-[460px]">
          {details ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
                    <PluginIcon className="size-5" icon={details.icon} />
                  </span>
                  <div>
                    <DialogTitle>{details.name}</DialogTitle>
                    <DialogDescription>
                      v{details.version} · {details.tool.label}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {details.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {details.tags.map((tag) => (
                  <span
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {details.installed ? (
                <p className="text-xs text-muted-foreground">
                  Mentionnez ce plugin dans le chat avec{" "}
                  <span className="font-medium text-foreground">
                    @{details.name}
                  </span>{" "}
                  pour l'utiliser au prochain message.
                </p>
              ) : null}
              <DialogFooter className="gap-2">
                {details.installed ? (
                  <Button
                    disabled={busyPluginId === details.id}
                    onClick={() => {
                      handleUninstall(details);
                      setDetails(null);
                    }}
                    variant="destructive"
                  >
                    <Trash2Icon className="size-4" />
                    Désinstaller
                  </Button>
                ) : (
                  <Button
                    disabled={busyPluginId === details.id}
                    onClick={() => {
                      handleInstall(details);
                      setDetails(null);
                    }}
                  >
                    <PlusIcon className="size-4" />
                    Installer
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
