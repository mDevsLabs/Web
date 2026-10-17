"use client";

import {
  CheckCircle2Icon,
  DownloadIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { McpLogItem } from "./mcp-types";

interface McpLogsTabProps {
  filteredLogs: McpLogItem[];
  handleExport: (
    fmt: "json" | "csv" | "md" | "txt",
    scope: "servers" | "logs"
  ) => void;
  handlePurgeLogs: () => void;
  logActionFilter: string;
  logServerFilter: string;
  logToolFilter: string;
  mutateLogs: () => void;
  setLogActionFilter: (v: string) => void;
  setLogServerFilter: (v: string) => void;
  setLogToolFilter: (v: string) => void;
}

export function McpLogsTab({
  logServerFilter,
  setLogServerFilter,
  logToolFilter,
  setLogToolFilter,
  logActionFilter,
  setLogActionFilter,
  mutateLogs,
  handleExport,
  handlePurgeLogs,
  filteredLogs,
}: McpLogsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold">Historique d'audit</h2>
          <p className="text-xs text-muted-foreground">
            Filtres + export 4 formats
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            className="h-7 text-xs w-28"
            onChange={(e) => setLogServerFilter(e.target.value)}
            placeholder="Serveur"
            value={logServerFilter}
          />
          <Input
            className="h-7 text-xs w-28"
            onChange={(e) => setLogToolFilter(e.target.value)}
            placeholder="Outil"
            value={logToolFilter}
          />
          <select
            className="h-7 rounded-md border bg-background px-2 text-xs"
            onChange={(e) => setLogActionFilter(e.target.value)}
            value={logActionFilter}
          >
            <option value="">Toutes les actions</option>
            <option value="read">read</option>
            <option value="write">write</option>
            <option value="delete">delete</option>
            <option value="execute">execute</option>
          </select>
          <Button
            className="h-7 text-xs"
            onClick={() => mutateLogs()}
            size="sm"
            variant="outline"
          >
            <RefreshCwIcon className="size-3 mr-1" />
            Actualiser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-7 text-xs" size="sm" variant="outline">
                <DownloadIcon className="size-3 mr-1" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("json", "logs")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv", "logs")}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("md", "logs")}>
                MD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("txt", "logs")}>
                TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="h-7 text-xs"
            onClick={handlePurgeLogs}
            size="sm"
            variant="destructive"
          >
            <Trash2Icon className="size-3 mr-1" />
            Purger
          </Button>
        </div>
      </div>
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center text-muted-foreground text-xs">
          Aucun log correspondant.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Serveur</th>
                  <th className="py-2.5 px-3">Outil</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3">Latence</th>
                  <th className="py-2.5 px-3 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredLogs.map((log) => (
                  <tr className="hover:bg-muted/30" key={log.id}>
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                      {log.serverName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-primary whitespace-nowrap">
                      {log.toolName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge
                        className={cn(
                          "text-[10px] uppercase font-semibold",
                          log.actionType === "write" ||
                            log.actionType === "delete"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                        )}
                        variant="outline"
                      >
                        {log.actionType}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        {log.error ? (
                          <span className="text-destructive font-medium">
                            Erreur
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2Icon className="size-3" />
                            Succès
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {log.durationMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Button
                        className="h-6 px-2 text-[10.5px]"
                        onClick={() => {
                          toast.info(
                            `Arguments: ${JSON.stringify(log.inputPayload ?? {})}`
                          );
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        Voir payload
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
