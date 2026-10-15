"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { McpServerItem } from "./mcp-types";

interface McpInspectToolsModalProps {
  isInspectingTools: McpServerItem | null;
  setIsInspectingTools: (server: McpServerItem | null) => void;
  handleToggleTool: (server: McpServerItem, toolName: string) => void;
  handleSetToolApproval: (
    server: McpServerItem,
    toolName: string,
    approval: string | null
  ) => void;
  handleRefreshTools: (server: McpServerItem) => void;
}

export function McpInspectToolsModal({
  isInspectingTools,
  setIsInspectingTools,
  handleToggleTool,
  handleSetToolApproval,
  handleRefreshTools,
}: McpInspectToolsModalProps) {
  return (
    <Dialog
      onOpenChange={(open) => !open && setIsInspectingTools(null)}
      open={Boolean(isInspectingTools)}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Outils : {isInspectingTools?.name}</DialogTitle>
          <DialogDescription>
            {((isInspectingTools?.toolsCache as any[]) || []).length} outil(s) —
            cochez per-tool + permission.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {((isInspectingTools?.toolsCache as any[]) || []).length === 0 && (
            <div className="text-xs text-muted-foreground text-center p-4">
              Aucun outil — synchronisez.
            </div>
          )}
          {((isInspectingTools?.toolsCache as any[]) || []).map(
            (t: any, idx: number) => {
              const overrides =
                ((isInspectingTools as any)?.toolOverrides as Record<
                  string,
                  any
                >) ?? {};
              const ov = overrides[t.name];
              const enabled = ov?.enabled !== false;
              const approval = ov?.requireApproval ?? null;
              return (
                <div
                  className={cn(
                    "p-3 rounded-xl border",
                    enabled
                      ? "border-border/50 bg-muted/10"
                      : "border-border/30 bg-muted/5 opacity-60"
                  )}
                  key={idx}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {t.name}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        checked={enabled}
                        className="size-4 accent-primary"
                        onChange={() =>
                          handleToggleTool(isInspectingTools!, t.name)
                        }
                        type="checkbox"
                      />
                      <span>{enabled ? "Activé" : "Désactivé"}</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t.description || "Aucune description"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px]">Permission outil:</Label>
                    <select
                      className="h-7 rounded-md border bg-background px-2 text-xs"
                      onChange={(e) =>
                        handleSetToolApproval(
                          isInspectingTools!,
                          t.name,
                          e.target.value || null
                        )
                      }
                      value={approval ?? ""}
                    >
                      <option value="">
                        Hérite (
                        {(isInspectingTools as any)?.requireApproval ??
                          "write_only"}
                        )
                      </option>
                      <option value="always_allow">always_allow</option>
                      <option value="write_only">write_only</option>
                      <option value="ask_permission">ask_permission</option>
                    </select>
                  </div>
                  {t.inputSchema?.properties && (
                    <div className="pt-2 border-t border-border/30 text-[11px] font-mono">
                      <span className="block font-sans font-medium text-[10px] uppercase mb-1">
                        Params:
                      </span>
                      {Object.entries(t.inputSchema.properties).map(
                        ([k, p]: [string, any]) => (
                          <div className="flex gap-1.5" key={k}>
                            <span className="text-foreground">{k}</span>
                            <span className="text-muted-foreground/60">
                              ({p.type})
                            </span>
                            <span className="truncate">{p.description}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              isInspectingTools && handleRefreshTools(isInspectingTools)
            }
            size="sm"
            variant="outline"
          >
            Resynchroniser
          </Button>
          <Button onClick={() => setIsInspectingTools(null)} size="sm">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
