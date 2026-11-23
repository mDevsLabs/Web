"use client";

import { SettingsIcon } from "@mdevs/icons/controls/settings";
import { Loader2Icon } from "@mdevs/icons/misc/loader-2";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApprovalPolicy } from "./mcp-types";

interface McpSettingsTabProps {
  handlePurgeMcp: () => void;
  handleSaveMcpPrefs: () => void;
  isSavingMcpPrefs: boolean;
  mcpAllowStdio: boolean;
  mcpDefaultApproval: ApprovalPolicy;
  mcpDefaultRateLimit: number;
  mcpDefaultTimeout: number;
  mcpKillSwitch: boolean;
  mcpRetention: number;
  setMcpAllowStdio: (v: boolean) => void;
  setMcpDefaultApproval: (v: ApprovalPolicy) => void;
  setMcpDefaultRateLimit: (v: number) => void;
  setMcpDefaultTimeout: (v: number) => void;
  setMcpKillSwitch: (v: boolean) => void;
  setMcpRetention: (v: number) => void;
}

export function McpSettingsTab({
  mcpKillSwitch,
  setMcpKillSwitch,
  mcpDefaultApproval,
  setMcpDefaultApproval,
  mcpDefaultTimeout,
  setMcpDefaultTimeout,
  mcpDefaultRateLimit,
  setMcpDefaultRateLimit,
  mcpRetention,
  setMcpRetention,
  mcpAllowStdio,
  setMcpAllowStdio,
  handlePurgeMcp,
  handleSaveMcpPrefs,
  isSavingMcpPrefs,
}: McpSettingsTabProps) {
  return (
    <div className="py-2 max-w-3xl">
      <div className="surface-card flex flex-col gap-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <SettingsIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Contrôle global MCP</h3>
            <p className="text-xs text-muted-foreground">
              Kill-switch, timeout, rate-limit et permissions par défaut.
            </p>
          </div>
          <span
            className={`ml-auto text-xs px-2 py-1 rounded-full border font-medium ${
              mcpKillSwitch
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-success/10 text-success border-success/20"
            }`}
          >
            {mcpKillSwitch ? "MCP OFF" : "MCP ON"}
          </span>
        </div>
        <label className="flex items-center justify-between p-3 rounded-xl border border-destructive/20 bg-destructive/5 cursor-pointer">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-destructive">
              Kill-switch global
            </span>
            <span className="text-xs text-muted-foreground">
              Désactive tous les appels MCP instantanément
            </span>
          </div>
          <input
            checked={mcpKillSwitch}
            className="size-5 accent-destructive"
            onChange={(e) => setMcpKillSwitch(e.target.checked)}
            type="checkbox"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Permission par défaut</Label>
            <select
              className="h-10 rounded-xl border border-border/60 bg-muted/30 px-3 text-sm"
              onChange={(e) =>
                setMcpDefaultApproval(e.target.value as ApprovalPolicy)
              }
              value={mcpDefaultApproval}
            >
              <option value="always_allow">always_allow (auto)</option>
              <option value="write_only">write_only (recommandé)</option>
              <option value="ask_permission">ask_permission (strict)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">
              Timeout par défaut (ms)
            </Label>
            <Input
              max={120_000}
              min={1000}
              onChange={(e) => setMcpDefaultTimeout(Number(e.target.value))}
              step={1000}
              type="number"
              value={mcpDefaultTimeout}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">
              Rate limit par défaut (/min)
            </Label>
            <Input
              max={1000}
              min={1}
              onChange={(e) => setMcpDefaultRateLimit(Number(e.target.value))}
              type="number"
              value={mcpDefaultRateLimit}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">
              Rétention logs (jours)
            </Label>
            <Input
              max={50}
              min={1}
              onChange={(e) => setMcpRetention(Number(e.target.value))}
              type="number"
              value={mcpRetention}
            />
            <span className="text-[11px] text-muted-foreground">
              Maximum 50 jours (entre 1 et 50).
            </span>
          </div>
        </div>
        <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              Autoriser transport stdio (local)
            </span>
            <span className="text-xs text-muted-foreground">
              Si désactivé, toute création stdio sera bloquée (403)
            </span>
          </div>
          <input
            checked={mcpAllowStdio}
            className="size-5 accent-primary"
            onChange={(e) => setMcpAllowStdio(e.target.checked)}
            type="checkbox"
          />
        </label>
        <div className="flex items-center gap-2 justify-end">
          <Button
            className="h-8 text-xs"
            onClick={handlePurgeMcp}
            size="sm"
            variant="destructive"
          >
            <Trash2Icon className="size-3 mr-1" />
            Purger tous les logs
          </Button>
          <Button
            className="h-8 text-xs"
            disabled={isSavingMcpPrefs}
            onClick={handleSaveMcpPrefs}
            size="sm"
          >
            {isSavingMcpPrefs ? (
              <>
                <Loader2Icon className="size-3 mr-1 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer préférences MCP"
            )}
          </Button>
        </div>
        <div className="surface-muted p-3 text-[11px] text-muted-foreground">
          Ces réglages s'appliquent à tous les serveurs MCP de votre compte. Les
          exports JSON/CSV/MD/TXT des serveurs et journaux sont disponibles
          depuis l'en-tête.
        </div>
      </div>
    </div>
  );
}
