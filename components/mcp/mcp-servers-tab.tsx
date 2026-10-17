import {
  CpuIcon,
  Edit2Icon,
  MoreVerticalIcon,
  PlusIcon,
  RefreshCwIcon,
  ServerIcon,
  ShieldCheckIcon,
  Trash2Icon,
  WrenchIcon,
  ZapIcon,
} from "@mdevs/icons";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { McpServer } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import type { McpTemplateRow } from "./mcp-types";

export function McpServersTab({
  isLoading,
  servers,
  installableTemplates,
  filteredServers,
  handleNewServer,
  handleToggleEnabled,
  handleRefreshTools,
  setIsInspectingTools,
  handleEditServer,
  setSkillToDelete,
}: {
  isLoading: boolean;
  servers: McpServer[];
  installableTemplates: McpTemplateRow[];
  filteredServers: McpServer[];
  handleNewServer: (tpl?: McpTemplateRow) => void;
  handleToggleEnabled: (s: McpServer) => void;
  handleRefreshTools: (s: McpServer) => void;
  setIsInspectingTools: (s: McpServer | null) => void;
  handleEditServer: (s: McpServer) => void;
  setSkillToDelete: (s: McpServer | null) => void;
}) {
  return (
    <div>
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
          <div className="size-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
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
      ) : filteredServers.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Aucun serveur ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServers.map((s) => {
            const toolsCount = (s.toolsCache as any[])?.length || 0;
            const overrides =
              ((s as any).toolOverrides as Record<string, any>) ?? {};
            const enabledCount = ((s.toolsCache as any[]) || []).filter(
              (t) => overrides[t.name]?.enabled !== false
            ).length;
            return (
              <div
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md relative group",
                  s.isEnabled
                    ? "border-border/60"
                    : "border-border/40 opacity-70 bg-muted/20"
                )}
                key={s.id}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <ServerIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {s.name}
                        </h3>
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            s.isEnabled
                              ? "bg-emerald-500"
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                        onClick={() => setSkillToDelete(s)}
                      >
                        <Trash2Icon className="size-3.5" />
                        <span>Supprimer</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[10.5px] text-muted-foreground">
                  <span
                    className={cn(
                      (s as any).uptimeStatus === "online"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    ● {(s as any).uptimeStatus ?? "unknown"}
                  </span>
                  <span>·</span>
                  <span>
                    {enabledCount}/{toolsCount} actifs
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <Badge
                    className="text-[10px] uppercase font-semibold px-2 py-0.5"
                    variant="outline"
                  >
                    {s.transport}
                  </Badge>
                  <Badge
                    className="text-[10px] px-2 py-0.5"
                    variant={s.authType === "none" ? "outline" : "secondary"}
                  >
                    {s.authType === "none"
                      ? "Pas d'auth"
                      : `Auth: ${s.authType}`}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-[10px] px-2 py-0.5",
                      s.requireApproval === "ask_permission"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : s.requireApproval === "write_only"
                          ? "bg-sky-500/10 text-sky-600 border-sky-500/30"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    )}
                    variant="outline"
                  >
                    <ShieldCheckIcon className="size-2.5 mr-1" />
                    {s.requireApproval === "ask_permission"
                      ? "Toujours demander"
                      : s.requireApproval === "write_only"
                        ? "Accord écriture"
                        : "Auto-approuvé"}
                  </Badge>
                  <Badge className="text-[10px] px-2 py-0.5" variant="outline">
                    ⏱ {(s as any).timeoutMs ?? 15_000}ms ·{" "}
                    {(s as any).rateLimitPerMin ?? 60}/min
                  </Badge>
                </div>
                <div className="pt-2 border-t border-border/40 mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <button
                    className="hover:underline flex items-center gap-1 text-[11px] font-medium text-foreground"
                    onClick={() => setIsInspectingTools(s)}
                    type="button"
                  >
                    <WrenchIcon className="size-3 text-primary" />
                    <span>
                      {enabledCount}/{toolsCount} outil(s) actif(s)
                    </span>
                  </button>
                  <Button
                    aria-label="Synchroniser les outils"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRefreshTools(s)}
                    size="sm"
                    title="Synchroniser les outils"
                    variant="ghost"
                  >
                    <RefreshCwIcon className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
