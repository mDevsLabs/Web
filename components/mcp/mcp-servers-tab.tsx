import {
  ActivityIcon,
  CopyIcon,
  CpuIcon,
  Edit2Icon,
  KeyIcon,
  Loader2Icon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  ServerIcon,
  ShieldCheckIcon,
  Trash2Icon,
  WrenchIcon,
  ZapIcon,
} from "@mdevs/icons";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { McpServerItem, McpTemplateRow } from "./mcp-types";

function formatRelativeDate(value: Date | string | null | undefined): string {
  if (!value) return "Jamais synchronisé";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Jamais synchronisé";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "Synchronisé à l'instant";
  if (diffMin < 60) return `Synchro il y a ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `Synchro il y a ${diffHours} h`;
  return `Synchro le ${date.toLocaleDateString("fr-FR")}`;
}

export function McpServersTab({
  isLoading,
  servers,
  installableTemplates,
  filteredServers,
  handleNewServer,
  handleToggleEnabled,
  handleRefreshTools,
  handleQuickTestServer,
  handleDuplicateServer,
  testingServerId,
  refreshingServerId,
  setIsInspectingTools,
  handleEditServer,
  setServerToDelete,
}: {
  isLoading: boolean;
  servers: McpServerItem[];
  installableTemplates: McpTemplateRow[];
  filteredServers: McpServerItem[];
  handleNewServer: (tpl?: McpTemplateRow) => void;
  handleToggleEnabled: (s: McpServerItem) => void;
  handleRefreshTools: (s: McpServerItem) => void;
  handleQuickTestServer?: (s: McpServerItem) => void;
  handleDuplicateServer?: (s: McpServerItem) => void;
  testingServerId?: string | null;
  refreshingServerId?: string | null;
  setIsInspectingTools: (s: McpServerItem | null) => void;
  handleEditServer: (s: McpServerItem) => void;
  setServerToDelete: (s: McpServerItem | null) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [transportFilter, setTransportFilter] = useState<string>("all");

  const visibleServers = useMemo(
    () =>
      filteredServers.filter((s) => {
        if (statusFilter === "active" && !s.isEnabled) return false;
        if (statusFilter === "inactive" && s.isEnabled) return false;
        if (transportFilter !== "all" && s.transport !== transportFilter) {
          return false;
        }
        return true;
      }),
    [filteredServers, statusFilter, transportFilter]
  );

  const activeCount = servers.filter((s) => s.isEnabled).length;
  const transports = useMemo(
    () => [...new Set(servers.map((s) => s.transport).filter(Boolean))],
    [servers]
  );

  return (
    <div className="space-y-4">
      {!isLoading && servers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="chip text-xs"
              data-active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              Tous ({servers.length})
            </button>
            <button
              className="chip text-xs"
              data-active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
              type="button"
            >
              Actifs ({activeCount})
            </button>
            <button
              className="chip text-xs"
              data-active={statusFilter === "inactive"}
              onClick={() => setStatusFilter("inactive")}
              type="button"
            >
              Inactifs ({servers.length - activeCount})
            </button>
          </div>
          {transports.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                className="chip text-[11px]"
                data-active={transportFilter === "all"}
                onClick={() => setTransportFilter("all")}
                type="button"
              >
                Tous transports
              </button>
              {transports.map((t) => (
                <button
                  className="chip text-[11px] uppercase"
                  data-active={transportFilter === t}
                  key={t}
                  onClick={() => setTransportFilter(t)}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              className="h-44 rounded-2xl border border-border/50 bg-muted/20 animate-pulse p-4"
              key={i}
            />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <CpuIcon className="size-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            Aucun serveur MCP configuré
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Le protocole MCP permet à l'IA d'interagir directement avec vos
            outils, fichiers et bases de données, avec un contrôle strict des
            autorisations.
          </p>
          <div className="w-full text-left mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Modèles préconfigurés :
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {installableTemplates.map((tmpl) => (
                <button
                  className="flex flex-col text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors group cursor-pointer"
                  key={tmpl.id}
                  onClick={() => handleNewServer(tmpl)}
                  type="button"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-foreground">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium bg-muted text-muted-foreground">
                      {tmpl.transport}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                    {tmpl.description}
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    Pré-remplir la configuration →
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Button
            className="gap-2 text-xs font-medium"
            onClick={() => handleNewServer()}
          >
            <PlusIcon className="size-4" />
            <span>Configurer un serveur personnalisé</span>
          </Button>
        </div>
      ) : visibleServers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Aucun serveur ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleServers.map((s) => {
            const toolsList = (s.toolsCache as Array<{ name: string }>) || [];
            const toolsCount = toolsList.length;
            const overrides =
              (s.toolOverrides as Record<string, { enabled?: boolean }>) ?? {};
            const enabledCount = toolsList.filter(
              (t) => overrides[t.name]?.enabled !== false
            ).length;
            const secretCount =
              (s.secretKeys?.auth?.length ?? 0) +
              (s.secretKeys?.env?.length ?? 0) +
              (s.secretKeys?.header?.length ?? 0);
            const missingAuthSecret =
              s.authType !== "none" && secretCount === 0;
            const isTestingThis = testingServerId === s.id;
            const isRefreshingThis = refreshingServerId === s.id;

            return (
              <div
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
                  s.isEnabled
                    ? "border-border/60"
                    : "border-border/40 opacity-75 bg-muted/20"
                )}
                key={s.id}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      <ServerIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {s.name}
                        </h3>
                        <span
                          className={cn(
                            "size-2 rounded-full shrink-0",
                            s.isEnabled
                              ? "bg-success"
                              : "bg-muted-foreground/40"
                          )}
                          title={s.isEnabled ? "Actif" : "Inactif"}
                        />
                      </div>
                      <p className="text-[11.5px] text-muted-foreground truncate">
                        {s.description ||
                          (s.transport === "stdio" ? s.command : s.url) ||
                          "Aucune description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      aria-label={
                        s.isEnabled
                          ? `Désactiver ${s.name}`
                          : `Activer ${s.name}`
                      }
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer",
                        s.isEnabled
                          ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
                          : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleToggleEnabled(s)}
                      type="button"
                    >
                      {s.isEnabled ? "Actif" : "Inactif"}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="size-7 p-0 text-muted-foreground hover:text-foreground"
                          variant="ghost"
                        >
                          <MoreVerticalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48"
                        collisionPadding={12}
                        side="bottom"
                        sideOffset={6}
                      >
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => handleToggleEnabled(s)}
                        >
                          <ZapIcon className="size-3.5" />
                          <span>{s.isEnabled ? "Désactiver" : "Activer"}</span>
                        </DropdownMenuItem>
                        {handleQuickTestServer && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs"
                            onClick={() => handleQuickTestServer(s)}
                          >
                            <ActivityIcon className="size-3.5" />
                            <span>Tester la connexion</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => handleRefreshTools(s)}
                        >
                          <RefreshCwIcon className="size-3.5" />
                          <span>Synchroniser les outils</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => setIsInspectingTools(s)}
                        >
                          <WrenchIcon className="size-3.5" />
                          <span>Gérer les outils ({toolsCount})</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs"
                          onClick={() => handleEditServer(s)}
                        >
                          <Edit2Icon className="size-3.5" />
                          <span>Modifier</span>
                        </DropdownMenuItem>
                        {handleDuplicateServer && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs"
                            onClick={() => handleDuplicateServer(s)}
                          >
                            <CopyIcon className="size-3.5" />
                            <span>Dupliquer</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                          onClick={() => setServerToDelete(s)}
                        >
                          <Trash2Icon className="size-3.5" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[10.5px] text-muted-foreground">
                  <span
                    className={cn(
                      s.uptimeStatus === "online"
                        ? "text-success"
                        : "text-warning"
                    )}
                  >
                    ● {s.uptimeStatus || "unknown"}
                  </span>
                  <span>·</span>
                  <span>
                    {enabledCount}/{toolsCount} outils actifs
                  </span>
                  {s.callCount > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        {s.callCount} appel{s.callCount > 1 ? "s" : ""} (
                        {s.avgLatencyMs} ms)
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <Badge
                    className="text-[10px] uppercase font-semibold px-2 py-0.5"
                    variant="outline"
                  >
                    {s.transport}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[10px] px-2 py-0.5 gap-1",
                      missingAuthSecret &&
                        "border-warning/30 bg-warning/10 text-warning"
                    )}
                    variant={s.authType === "none" ? "outline" : "secondary"}
                  >
                    {s.authType === "none"
                      ? "Pas d'auth"
                      : missingAuthSecret
                        ? `Auth ${s.authType} manquante`
                        : `Auth: ${s.authType}`}
                  </Badge>
                  {secretCount > 0 && (
                    <Badge
                      className="text-[10px] px-2 py-0.5 gap-1 border-success/30 bg-success/10 text-success"
                      variant="outline"
                    >
                      <KeyIcon className="size-2.5" />
                      {secretCount} secret{secretCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Badge
                    className={cn(
                      "text-[10px] px-2 py-0.5",
                      s.requireApproval === "ask_permission"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : s.requireApproval === "always_allow"
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-info/10 text-info border-info/30"
                    )}
                    variant="outline"
                  >
                    <ShieldCheckIcon className="size-2.5 mr-1" />
                    {s.requireApproval}
                  </Badge>
                </div>

                <div className="mt-auto pt-2.5 border-t border-border/40 flex items-center justify-between gap-1.5">
                  <span className="text-[10px] text-muted-foreground truncate">
                    {formatRelativeDate(s.lastSyncAt)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {handleQuickTestServer && s.transport !== "stdio" && (
                      <Button
                        className="h-7 px-2 text-[11px]"
                        disabled={isTestingThis}
                        onClick={() => handleQuickTestServer(s)}
                        size="sm"
                        title="Tester la connexion"
                        variant="ghost"
                      >
                        {isTestingThis ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : (
                          "Tester"
                        )}
                      </Button>
                    )}
                    <Button
                      className="h-7 px-2 text-[11px]"
                      disabled={isRefreshingThis}
                      onClick={() => handleRefreshTools(s)}
                      size="sm"
                      title="Synchroniser les outils"
                      variant="ghost"
                    >
                      <RefreshCwIcon
                        className={cn(
                          "size-3",
                          isRefreshingThis && "animate-spin"
                        )}
                      />
                    </Button>
                    <Button
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setIsInspectingTools(s)}
                      size="sm"
                      variant="outline"
                    >
                      Outils ({toolsCount})
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
