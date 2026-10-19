"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleIcon,
  KeyIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  Trash2Icon,
} from "lucide-react";
import type React from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  ApprovalPolicy,
  McpAuthType,
  McpServerItem,
  McpTransport,
} from "./mcp-types";

interface McpServerModalProps {
  editingServer: McpServerItem | null;
  formArgs: string;
  formAuthType: McpAuthType;
  formCommand: string;
  formDescription: string;
  formEnvPairs: Array<{ k: string; v: string }>;
  formHeaders: string;
  formName: string;
  formPassword: string;
  formRateLimit: number;
  formRequireApproval: ApprovalPolicy;
  formTimeoutMs: number;
  formToken: string;
  formTransport: McpTransport;
  formUrl: string;
  formUsername: string;
  handleSaveServer: (e: React.FormEvent) => void;
  handleTestConnection: () => void;
  isOpen: boolean;
  isSaving: boolean;
  isTesting: boolean;
  setFormArgs: (v: string) => void;
  setFormAuthType: (v: McpAuthType) => void;
  setFormCommand: (v: string) => void;
  setFormDescription: (v: string) => void;
  setFormEnvPairs: React.Dispatch<
    React.SetStateAction<Array<{ k: string; v: string }>>
  >;
  setFormHeaders: (v: string) => void;
  setFormName: (v: string) => void;
  setFormPassword: (v: string) => void;
  setFormRateLimit: (v: number) => void;
  setFormRequireApproval: (v: ApprovalPolicy) => void;
  setFormTimeoutMs: (v: number) => void;
  setFormToken: (v: string) => void;
  setFormTransport: (v: McpTransport) => void;
  setFormUrl: (v: string) => void;
  setFormUsername: (v: string) => void;
  setIsOpen: (open: boolean) => void;
  testResult: { success: boolean; message: string } | null;
}

export function McpServerModal({
  isOpen,
  setIsOpen,
  editingServer,
  handleSaveServer,
  formName,
  setFormName,
  formTransport,
  setFormTransport,
  formDescription,
  setFormDescription,
  formCommand,
  setFormCommand,
  formArgs,
  setFormArgs,
  formEnvPairs,
  setFormEnvPairs,
  formUrl,
  setFormUrl,
  formTimeoutMs,
  setFormTimeoutMs,
  formRateLimit,
  setFormRateLimit,
  formAuthType,
  setFormAuthType,
  formToken,
  setFormToken,
  formUsername,
  setFormUsername,
  formPassword,
  setFormPassword,
  formHeaders,
  setFormHeaders,
  formRequireApproval,
  setFormRequireApproval,
  testResult,
  isTesting,
  handleTestConnection,
  isSaving,
}: McpServerModalProps) {
  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingServer
              ? "Modifier le serveur MCP"
              : "Connecter un nouveau serveur MCP"}
          </DialogTitle>
          <DialogDescription>
            Configurez transport, auth, timeout, rate-limit, variables
            d'environnement et permissions.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4 py-2" onSubmit={handleSaveServer}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">Nom du serveur *</Label>
              <Input
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Mon serveur MCP"
                required
                value={formName}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Moyen d'appel *</Label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                onChange={(e) =>
                  setFormTransport(e.target.value as McpTransport)
                }
                value={formTransport}
              >
                <option value="sse">Distant SSE</option>
                <option value="http">Distant HTTP</option>
                <option value="stdio">Local Stdio</option>
                <option value="websocket">WebSocket</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description</Label>
            <Input
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Rôle ou données exposées..."
              value={formDescription}
            />
          </div>
          {formTransport === "stdio" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Commande système *
                </Label>
                <Input
                  onChange={(e) => setFormCommand(e.target.value)}
                  placeholder="npx ou python"
                  required
                  value={formCommand}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Arguments</Label>
                <Input
                  onChange={(e) => setFormArgs(e.target.value)}
                  placeholder="-y @modelcontextprotocol/server-postgres ..."
                  value={formArgs}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">
                  Variables d'environnement
                </Label>
                {formEnvPairs.map((p, idx) => (
                  <div className="flex gap-2" key={idx}>
                    <Input
                      className="h-8 text-xs flex-1"
                      onChange={(e) =>
                        setFormEnvPairs((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, k: e.target.value } : x
                          )
                        )
                      }
                      placeholder="CLÉ"
                      value={p.k}
                    />
                    <Input
                      className="h-8 text-xs flex-1"
                      onChange={(e) =>
                        setFormEnvPairs((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, v: e.target.value } : x
                          )
                        )
                      }
                      placeholder="valeur (chiffrée)"
                      value={p.v}
                    />
                    <Button
                      onClick={() =>
                        setFormEnvPairs((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  className="h-7 text-xs"
                  onClick={() =>
                    setFormEnvPairs((prev) => [...prev, { k: "", v: "" }])
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PlusIcon className="size-3 mr-1" />
                  Ajouter variable
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                URL du serveur MCP *
              </Label>
              <Input
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://votre-serveur-mcp.com/sse"
                required
                value={formUrl}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Timeout (ms)</Label>
              <Input
                max={120_000}
                min={1000}
                onChange={(e) => setFormTimeoutMs(Number(e.target.value))}
                step={1000}
                type="number"
                value={formTimeoutMs}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Rate limit /min</Label>
              <Input
                max={1000}
                min={1}
                onChange={(e) => setFormRateLimit(Number(e.target.value))}
                type="number"
                value={formRateLimit}
              />
            </div>
          </div>
          <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyIcon className="size-4 text-primary" />
                <Label className="text-xs font-semibold">
                  Authentification
                </Label>
              </div>
              <select
                className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                onChange={(e) => setFormAuthType(e.target.value as McpAuthType)}
                value={formAuthType}
              >
                <option value="none">Aucune</option>
                <option value="bearer">Bearer</option>
                <option value="basic">Basic</option>
                <option value="custom_headers">En-têtes JSON</option>
              </select>
            </div>
            {formAuthType === "bearer" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Jeton Bearer</Label>
                <Input
                  onChange={(e) => setFormToken(e.target.value)}
                  placeholder="eyJ..."
                  type="password"
                  value={formToken}
                />
              </div>
            )}
            {formAuthType === "basic" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Utilisateur</Label>
                  <Input
                    onChange={(e) => setFormUsername(e.target.value)}
                    value={formUsername}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mot de passe</Label>
                  <Input
                    onChange={(e) => setFormPassword(e.target.value)}
                    type="password"
                    value={formPassword}
                  />
                </div>
              </div>
            )}
            {formAuthType === "custom_headers" && (
              <div className="space-y-1.5">
                <Label className="text-xs">En-têtes JSON</Label>
                <Textarea
                  className="font-mono text-xs h-20"
                  onChange={(e) => setFormHeaders(e.target.value)}
                  placeholder='{"X-API-Key":"..."}'
                  value={formHeaders}
                />
              </div>
            )}
          </div>
          <div className="space-y-2 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.02]">
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="size-4 text-primary" />
              <Label className="text-xs font-semibold">
                Politique globale (héritée par les outils)
              </Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                className={cn(
                  "flex flex-col text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                  formRequireApproval === "always_allow"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border/50 hover:bg-muted/30"
                )}
                onClick={() => setFormRequireApproval("always_allow")}
                type="button"
              >
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <CircleIcon className="size-2.5 fill-emerald-500 text-emerald-500" />
                  Automatique
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Sans confirmation
                </span>
              </button>
              <button
                className={cn(
                  "flex flex-col text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                  formRequireApproval === "write_only"
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-border/50 hover:bg-muted/30"
                )}
                onClick={() => setFormRequireApproval("write_only")}
                type="button"
              >
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <CircleIcon className="size-2.5 fill-sky-500 text-sky-500" />
                  Écriture
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Lecture directe
                </span>
              </button>
              <button
                className={cn(
                  "flex flex-col text-left p-2.5 rounded-xl border transition-colors cursor-pointer",
                  formRequireApproval === "ask_permission"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border/50 hover:bg-muted/30"
                )}
                onClick={() => setFormRequireApproval("ask_permission")}
                type="button"
              >
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <CircleIcon className="size-2.5 fill-amber-500 text-amber-500" />
                  Systématique
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Toujours demander
                </span>
              </button>
            </div>
          </div>
          {testResult && (
            <div
              className={cn(
                "p-3 rounded-xl border text-xs flex items-center gap-2",
                testResult.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              {testResult.success ? (
                <CheckCircle2Icon className="size-4 shrink-0" />
              ) : (
                <AlertCircleIcon className="size-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
            <Button
              disabled={isTesting}
              onClick={handleTestConnection}
              type="button"
              variant="outline"
            >
              {isTesting ? (
                <>
                  <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
                  Test...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="size-3.5 mr-1.5" />
                  Tester
                </>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsOpen(false)}
                type="button"
                variant="ghost"
              >
                Annuler
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Enregistrement..." : "Sauvegarder"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
