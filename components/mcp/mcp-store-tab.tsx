import { Loader2Icon, PlusIcon, StoreIcon, ZapIcon } from "@mdevs/icons";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { McpServer } from "@/lib/db/schema";
import { matchesQuery, sortByRelevance } from "@/lib/tools/search";
import { cn } from "@/lib/utils";
import type { McpTemplateRow, STORE_CONNECTORS } from "./mcp-types";

type StoreConnectorItem = (typeof STORE_CONNECTORS)[number];

export function McpStoreTab({
  storeConnectors,
  searchQuery,
  servers,
  installingConnector,
  handleStoreConnector,
  templates,
  setActiveTab,
}: {
  storeConnectors: Array<{
    connector: StoreConnectorItem;
    tpl: McpTemplateRow;
  }>;
  searchQuery: string;
  servers: McpServer[];
  installingConnector: string | null;
  handleStoreConnector: (
    connector: StoreConnectorItem,
    installed?: McpServer
  ) => void;
  templates: McpTemplateRow[];
  setActiveTab: (tab: any) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-5">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <StoreIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Store de connecteurs</h2>
            <p className="text-xs text-muted-foreground">
              Activez vos outils favoris en un clic — configuration automatique
              depuis les templates MCP.
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortByRelevance(
          storeConnectors.filter(({ connector, tpl }) =>
            matchesQuery(searchQuery, {
              primary: tpl.name,
              secondary: [connector.highlight, tpl.description],
            })
          ),
          searchQuery,
          ({ connector, tpl }) => ({
            primary: tpl.name,
            secondary: [connector.highlight, tpl.description],
          })
        ).map(({ connector, tpl }) => {
          const Icon = connector.icon;
          const installed = servers.find(
            (s) => (s.templateId ?? null) === tpl.id || s.name === tpl.name
          );
          const isBusy = installingConnector === tpl.name;
          return (
            <div
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
                installed?.isEnabled
                  ? "border-emerald-500/40"
                  : "border-border/60"
              )}
              key={connector.templateId}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    connector.tint,
                    connector.color
                  )}
                >
                  <Icon className="size-5.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{tpl.name}</h3>
                    {installed && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          installed.isEnabled
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            installed.isEnabled
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/50"
                          )}
                        />
                        {installed.isEnabled ? "Actif" : "Inactif"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <Badge
                  className="text-[10px] uppercase font-semibold px-2 py-0.5"
                  variant="outline"
                >
                  {tpl.transport}
                </Badge>
                {tpl.authType !== "none" && (
                  <Badge
                    className="text-[10px] px-2 py-0.5"
                    variant="secondary"
                  >
                    {tpl.authType}
                  </Badge>
                )}
                <Badge className="text-[10px] px-2 py-0.5" variant="outline">
                  {tpl.minTier.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-auto">
                <Button
                  className={cn(
                    "w-full gap-2 text-xs font-medium",
                    installed?.isEnabled &&
                      "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  )}
                  disabled={Boolean(installingConnector)}
                  onClick={() => handleStoreConnector(connector, installed)}
                  variant={installed?.isEnabled ? "outline" : "default"}
                >
                  {isBusy ? (
                    <>
                      <Loader2Icon className="size-3.5 animate-spin" />
                      {installed
                        ? installed.isEnabled
                          ? "Désactivation..."
                          : "Activation..."
                        : "Connexion..."}
                    </>
                  ) : installed ? (
                    <>
                      <ZapIcon className="size-3.5" />
                      {installed.isEnabled ? "Désactiver" : "Activer"}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="size-3.5" />
                      Connecter en 1 clic
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Un connecteur manquant ? Retrouvez les {templates.length} modèles du
        catalogue (dont les intégrations OAuth documentées) dans l'onglet{" "}
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => setActiveTab("library")}
          type="button"
        >
          Bibliothèque
        </button>
        .
      </p>
    </div>
  );
}
