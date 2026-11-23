"use client";

import { CodeIcon } from "@mdevs/icons";
import { CheckCircle2Icon } from "@mdevs/icons/controls/check-circle-2";
import { PlusIcon } from "@mdevs/icons/controls/plus";
import { CircleIcon } from "@mdevs/icons/interface/circle";
import { AlertCircleIcon } from "@mdevs/icons/misc/alert-circle";
import { Loader2Icon } from "@mdevs/icons/misc/loader-2";
import { RefreshCwIcon } from "@mdevs/icons/misc/refresh-cw";
import { Trash2Icon } from "@mdevs/icons/objects/trash-2";
import { KeyIcon } from "@mdevs/icons/security/key";
import { ShieldAlertIcon } from "@mdevs/icons/security/shield-alert";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { McpTemplateCredential } from "@/lib/mcp-templates/types";
import { cn } from "@/lib/utils";
import type {
  ApprovalPolicy,
  McpAuthType,
  McpEnvPair,
  McpServerItem,
  McpTransport,
} from "./mcp-types";

export interface ParsedMcpJsonImport {
  args?: string;
  command?: string;
  env?: McpEnvPair[];
  headers?: string;
  name?: string;
  transport?: McpTransport;
  url?: string;
}

function parseMcpServerJson(raw: string): ParsedMcpJsonImport | null {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return null;

  let name: string | undefined;
  let entry: Record<string, any> = parsed as Record<string, any>;

  if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
    const first = Object.entries(parsed.mcpServers)[0];
    if (!first || typeof first[1] !== "object" || !first[1]) return null;
    name = first[0];
    entry = first[1] as Record<string, any>;
  }

  const transport: McpTransport =
    typeof entry.transport === "string" &&
    ["http", "sse", "stdio", "websocket"].includes(entry.transport)
      ? (entry.transport as McpTransport)
      : entry.command
        ? "stdio"
        : entry.url?.startsWith("ws")
          ? "websocket"
          : "http";

  const envPairs: McpEnvPair[] | undefined =
    entry.env && typeof entry.env === "object"
      ? Object.entries(entry.env).map(([k, v]) => ({
          k,
          v: String(v ?? ""),
        }))
      : undefined;

  return {
    args: Array.isArray(entry.args)
      ? entry.args.map(String).join(" ")
      : typeof entry.args === "string"
        ? entry.args
        : undefined,
    command: typeof entry.command === "string" ? entry.command : undefined,
    env: envPairs,
    headers:
      entry.headers && typeof entry.headers === "object"
        ? JSON.stringify(entry.headers, null, 2)
        : undefined,
    name: typeof entry.name === "string" ? entry.name : name,
    transport,
    url: typeof entry.url === "string" ? entry.url : undefined,
  };
}

interface McpServerModalProps {
  editingServer: McpServerItem | null;
  formArgs: string;
  formAuthType: McpAuthType;
  formClientId: string;
  formClientSecret: string;
  formCommand: string;
  formDescription: string;
  formEnvPairs: McpEnvPair[];
  formHeaders: string;
  formName: string;
  formPassword: string;
  formRateLimit: number;
  formRequireApproval: ApprovalPolicy;
  formTimeoutMs: number;
  formToken: string;
  formTokenUrl: string;
  formTransport: McpTransport;
  formUrl: string;
  formUsername: string;
  handleSaveServer: (e: React.FormEvent) => void;
  handleTestConnection: () => void;
  isOpen: boolean;
  isSaving: boolean;
  isTesting: boolean;
  onApplyJsonImport?: (data: ParsedMcpJsonImport) => void;
  onMarkRemoveSecret?: (kind: "auth" | "env" | "header", key: string) => void;
  removedSecrets?: Array<{ kind: "auth" | "env" | "header"; key: string }>;
  setFormArgs: (v: string) => void;
  setFormAuthType: (v: McpAuthType) => void;
  setFormClientId: (v: string) => void;
  setFormClientSecret: (v: string) => void;
  setFormCommand: (v: string) => void;
  setFormDescription: (v: string) => void;
  setFormEnvPairs: React.Dispatch<React.SetStateAction<McpEnvPair[]>>;
  setFormHeaders: (v: string) => void;
  setFormName: (v: string) => void;
  setFormPassword: (v: string) => void;
  setFormRateLimit: (v: number) => void;
  setFormRequireApproval: (v: ApprovalPolicy) => void;
  setFormTimeoutMs: (v: number) => void;
  setFormToken: (v: string) => void;
  setFormTokenUrl: (v: string) => void;
  setFormTransport: (v: McpTransport) => void;
  setFormUrl: (v: string) => void;
  setFormUsername: (v: string) => void;
  setIsOpen: (open: boolean) => void;
  setTemplateSecretDrafts?: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  templateCredentials?: McpTemplateCredential[];
  templateSecretDrafts?: Record<string, string>;
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
  formClientId,
  setFormClientId,
  formClientSecret,
  setFormClientSecret,
  formTokenUrl,
  setFormTokenUrl,
  formHeaders,
  setFormHeaders,
  formRequireApproval,
  setFormRequireApproval,
  templateCredentials = [],
  templateSecretDrafts = {},
  setTemplateSecretDrafts,
  onMarkRemoveSecret,
  removedSecrets = [],
  onApplyJsonImport,
  testResult,
  isTesting,
  handleTestConnection,
  isSaving,
}: McpServerModalProps) {
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonImportText, setJsonImportText] = useState("");
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);

  const authKeys = editingServer?.secretKeys?.auth ?? [];
  const headerKeys = editingServer?.secretKeys?.header ?? [];
  const envKeys = editingServer?.secretKeys?.env ?? [];

  const isMarkedRemoved = (kind: "auth" | "env" | "header", key: string) =>
    removedSecrets.some((item) => item.kind === kind && item.key === key);

  const hasAuthSecret = (key: string) =>
    authKeys.includes(key) && !isMarkedRemoved("auth", key);

  const hasTemplateSecret = (c: McpTemplateCredential) => {
    const list =
      c.kind === "env" ? envKeys : c.kind === "header" ? headerKeys : authKeys;
    return list.includes(c.key) && !isMarkedRemoved(c.kind, c.key);
  };

  const handleImportJson = () => {
    setJsonImportError(null);
    try {
      const parsed = parseMcpServerJson(jsonImportText);
      if (!parsed) {
        setJsonImportError(
          "Structure JSON non reconnue. Utilisez { mcpServers: { ... } } ou { url, transport }."
        );
        return;
      }
      onApplyJsonImport?.(parsed);
      setShowJsonImport(false);
      setJsonImportText("");
    } catch {
      setJsonImportError("JSON invalide. Vérifiez la syntaxe.");
    }
  };

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
            Configurez transport, authentification chiffrée, timeout, rate-limit
            et permissions.
          </DialogDescription>
        </DialogHeader>

        {!editingServer && onApplyJsonImport && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                <CodeIcon className="size-3.5 text-primary" />
                Importer une configuration JSON (mcpServers)
              </span>
              <Button
                className="h-7 text-xs"
                onClick={() => setShowJsonImport((v) => !v)}
                size="sm"
                type="button"
                variant="outline"
              >
                {showJsonImport ? "Masquer" : "Coller JSON"}
              </Button>
            </div>
            {showJsonImport && (
              <div className="space-y-2 pt-1">
                <Textarea
                  className="font-mono text-xs h-24"
                  onChange={(e) => setJsonImportText(e.target.value)}
                  placeholder='{"mcpServers":{"mon-serveur":{"url":"https://...","headers":{"Authorization":"Bearer ..."}}}}'
                  value={jsonImportText}
                />
                {jsonImportError && (
                  <p className="text-[11px] text-destructive">
                    {jsonImportError}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button
                    disabled={!jsonImportText.trim()}
                    onClick={handleImportJson}
                    size="sm"
                    type="button"
                  >
                    Pré-remplir le formulaire
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

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
                <option value="http">Distant HTTP</option>
                <option value="sse">Distant SSE</option>
                <option value="websocket">WebSocket</option>
                <option value="stdio">Local Stdio</option>
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
                  <div
                    className="flex items-center gap-2"
                    key={`${p.k}-${idx}`}
                  >
                    <Input
                      className="h-8 text-xs flex-1 font-mono"
                      disabled={Boolean(p.configured)}
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
                      placeholder={
                        p.configured
                          ? "•••••••• (laisser vide pour conserver)"
                          : "valeur (chiffrée)"
                      }
                      type={p.configured ? "password" : "text"}
                      value={p.v}
                    />
                    {p.configured && (
                      <Badge
                        className="text-[10px] border-success/30 bg-success/10 text-success shrink-0"
                        variant="outline"
                      >
                        Chiffrée
                      </Badge>
                    )}
                    <Button
                      onClick={() => {
                        if (p.configured && p.k) {
                          onMarkRemoveSecret?.("env", p.k);
                        }
                        setFormEnvPairs((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                      }}
                      size="sm"
                      title="Supprimer cette variable"
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
                placeholder="https://votre-serveur-mcp.com/mcp"
                required
                value={formUrl}
              />
            </div>
          )}

          {editingServer && templateCredentials.length > 0 && (
            <div className="space-y-3 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyIcon className="size-4 text-primary" />
                  <Label className="text-xs font-semibold">
                    Identifiants requis par le modèle
                  </Label>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Stockage chiffré AES-256-GCM
                </span>
              </div>
              <div className="space-y-2.5">
                {templateCredentials.map((cred) => {
                  const configured = hasTemplateSecret(cred);
                  return (
                    <div className="space-y-1" key={cred.key}>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">
                          {cred.label}
                          {cred.required ? " *" : ""}
                        </Label>
                        {configured ? (
                          <Badge
                            className="text-[10px] border-success/30 bg-success/10 text-success"
                            variant="outline"
                          >
                            Configuré
                          </Badge>
                        ) : cred.required ? (
                          <Badge
                            className="text-[10px] border-warning/30 bg-warning/10 text-warning"
                            variant="outline"
                          >
                            Requis
                          </Badge>
                        ) : null}
                      </div>
                      <Input
                        onChange={(e) =>
                          setTemplateSecretDrafts?.((prev) => ({
                            ...prev,
                            [cred.key]: e.target.value,
                          }))
                        }
                        placeholder={
                          configured
                            ? "•••••••• (laisser vide pour conserver)"
                            : cred.key
                        }
                        type="password"
                        value={templateSecretDrafts[cred.key] ?? ""}
                      />
                    </div>
                  );
                })}
              </div>
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
                <option value="oauth2">OAuth 2.0 (Client Credentials)</option>
                <option value="custom_headers">En-têtes JSON</option>
              </select>
            </div>
            {formAuthType === "bearer" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Jeton Bearer</Label>
                  {hasAuthSecret("token") && (
                    <Badge
                      className="text-[10px] border-success/30 bg-success/10 text-success"
                      variant="outline"
                    >
                      Configuré (chiffré)
                    </Badge>
                  )}
                </div>
                <Input
                  onChange={(e) => setFormToken(e.target.value)}
                  placeholder={
                    hasAuthSecret("token")
                      ? "•••••••• (laisser vide pour conserver le jeton)"
                      : "eyJ..."
                  }
                  type="password"
                  value={formToken}
                />
              </div>
            )}
            {formAuthType === "basic" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Utilisateur</Label>
                    {hasAuthSecret("username") && (
                      <Badge
                        className="text-[10px] border-success/30 bg-success/10 text-success"
                        variant="outline"
                      >
                        Chiffré
                      </Badge>
                    )}
                  </div>
                  <Input
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder={
                      hasAuthSecret("username")
                        ? "•••••••• (inchangé si vide)"
                        : "Nom d'utilisateur"
                    }
                    value={formUsername}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mot de passe</Label>
                    {hasAuthSecret("password") && (
                      <Badge
                        className="text-[10px] border-success/30 bg-success/10 text-success"
                        variant="outline"
                      >
                        Chiffré
                      </Badge>
                    )}
                  </div>
                  <Input
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={
                      hasAuthSecret("password")
                        ? "•••••••• (inchangé si vide)"
                        : "Mot de passe"
                    }
                    type="password"
                    value={formPassword}
                  />
                </div>
              </div>
            )}
            {formAuthType === "oauth2" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">URL du jeton (Token URL)</Label>
                  <Input
                    onChange={(e) => setFormTokenUrl(e.target.value)}
                    placeholder={
                      hasAuthSecret("tokenUrl")
                        ? "•••••••• (inchangé si vide)"
                        : "https://auth.exemple.com/oauth/token"
                    }
                    value={formTokenUrl}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Client ID</Label>
                    <Input
                      onChange={(e) => setFormClientId(e.target.value)}
                      placeholder={
                        hasAuthSecret("clientId")
                          ? "•••••••• (inchangé si vide)"
                          : "client_id"
                      }
                      value={formClientId}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Client Secret</Label>
                    <Input
                      onChange={(e) => setFormClientSecret(e.target.value)}
                      placeholder={
                        hasAuthSecret("clientSecret")
                          ? "•••••••• (inchangé si vide)"
                          : "client_secret"
                      }
                      type="password"
                      value={formClientSecret}
                    />
                  </div>
                </div>
              </div>
            )}
            {formAuthType === "custom_headers" && (
              <div className="space-y-2">
                {headerKeys.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      En-têtes enregistrés :
                    </span>
                    {headerKeys
                      .filter((k: string) => !isMarkedRemoved("header", k))
                      .map((k: string) => (
                        <Badge
                          className="text-[10px] gap-1 border-success/30 bg-success/10 text-success"
                          key={k}
                          variant="outline"
                        >
                          <span>{k}</span>
                          {onMarkRemoveSecret && (
                            <button
                              aria-label={`Supprimer l'en-tête ${k}`}
                              className="hover:text-destructive cursor-pointer ml-0.5"
                              onClick={() => onMarkRemoveSecret("header", k)}
                              type="button"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {headerKeys.length > 0
                      ? "Ajouter ou remplacer des en-têtes (JSON)"
                      : "En-têtes JSON"}
                  </Label>
                  <Textarea
                    className="font-mono text-xs h-20"
                    onChange={(e) => setFormHeaders(e.target.value)}
                    placeholder='{"X-API-Key":"..."}'
                    value={formHeaders}
                  />
                </div>
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
                    ? "border-success bg-success/10"
                    : "border-border/50 hover:bg-muted/30"
                )}
                onClick={() => setFormRequireApproval("always_allow")}
                type="button"
              >
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <CircleIcon className="size-2.5 fill-success text-success" />
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
                    ? "border-info bg-info/10"
                    : "border-border/50 hover:bg-muted/30"
                )}
                onClick={() => setFormRequireApproval("write_only")}
                type="button"
              >
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <CircleIcon className="size-2.5 fill-info text-info" />
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
                    ? "border-warning bg-warning/10"
                    : "border-border/50 hover:bg-muted/30"
                )}
                onClick={() => setFormRequireApproval("ask_permission")}
                type="button"
              >
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <CircleIcon className="size-2.5 fill-warning text-warning" />
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
                  ? "border-success/30 bg-success/10 text-success"
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
