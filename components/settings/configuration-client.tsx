"use client";

import { ArrowRightIcon, PlusIcon, SquareSlashIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { AgentIcon } from "@/components/agents/agent-icon";
import { AGENT_COLORS, AGENT_ICONS } from "@/components/agents/agent-presets";
import { UpgradeDialog } from "@/components/common/upgrade-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTier } from "@/hooks/use-tier";
import { TOOL_IDS, TOOLS_META } from "@/lib/ai/tools/config";
import {
  COMMAND_ACTION_LABELS,
  COMMAND_ACTION_TYPES,
  type CommandActionType,
} from "@/lib/commands/types";
import type { CustomCommand } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CommandPayloadForm = {
  agentId?: string;
  promptText?: string;
  route?: string;
  serverIds?: string[];
  skillId?: string;
  toolIds?: string[];
};

const NAVIGATION_ROUTES = [
  { label: "Projets", value: "/projects" },
  { label: "Bibliothèque", value: "/library" },
  { label: "Agents", value: "/agents" },
  { label: "Compétences", value: "/skills" },
  { label: "Serveurs MCP", value: "/mcp" },
  { label: "Images", value: "/images" },
  { label: "Audio", value: "/audio" },
  { label: "Paramètres — Consommation", value: "/settings?tab=usage" },
  { label: "Paramètres — Profil", value: "/settings?tab=profile" },
  { label: "Paramètres — Préférences IA", value: "/settings?tab=preferences" },
];

const emptyForm = () => ({
  actionType: "prompt" as CommandActionType,
  color: "#6366f1",
  description: "",
  enabled: true,
  icon: "zap",
  kind: "slash" as "slash" | "mention",
  name: "",
  payload: {} as CommandPayloadForm,
  trigger: "",
});

type CommandForm = ReturnType<typeof emptyForm>;

export function ConfigurationSection() {
  const { isFree } = useTier();
  const { data: commands = [], mutate } = useSWR<CustomCommand[]>(
    isFree ? null : "/api/commands",
    fetcher
  );
  const { data: mcpData } = useSWR<{
    servers: Array<{ id: string; name: string; isEnabled: boolean }>;
  }>(isFree ? null : "/api/mcp", fetcher);
  const mcpServers = mcpData?.servers ?? [];
  const { data: agents = [] } = useSWR<Array<{ id: string; name: string }>>(
    isFree ? null : "/api/agents",
    fetcher
  );
  const { data: skills = [] } = useSWR<Array<{ id: string; name: string }>>(
    isFree ? null : "/api/skills",
    fetcher
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CommandForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const setFormPartial = (partial: Partial<CommandForm>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };

  const openEdit = (command: CustomCommand) => {
    setEditingId(command.id);
    setForm({
      actionType: command.actionType as CommandActionType,
      color: command.color ?? "#6366f1",
      description: command.description ?? "",
      enabled: command.enabled,
      icon: command.icon ?? "zap",
      kind: command.kind as "slash" | "mention",
      name: command.name,
      payload: ((command.payload ?? {}) as CommandPayloadForm) ?? {},
      trigger: command.trigger,
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.trigger.trim()) {
      toast.error("Le nom et le déclencheur sont obligatoires.");
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        actionType: form.actionType,
        color: form.color,
        description: form.description,
        enabled: form.enabled,
        icon: form.icon,
        kind: form.kind,
        name: form.name,
        payload: form.payload,
        trigger: form.trigger,
      };
      const res = editingId
        ? await fetch(`/api/commands/${editingId}`, {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
          })
        : await fetch("/api/commands", {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de l'enregistrement");
      }
      toast.success(
        editingId ? "Commande mise à jour." : "Commande créée avec succès."
      );
      setEditorOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (command: CustomCommand) => {
    try {
      const res = await fetch(`/api/commands/${command.id}`, {
        body: JSON.stringify({ enabled: !command.enabled }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Erreur");
      }
      mutate();
    } catch {
      toast.error("Impossible de modifier la commande.");
    }
  };

  const handleDelete = async (command: CustomCommand) => {
    try {
      const res = await fetch(`/api/commands/${command.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Erreur");
      }
      toast.success("Commande supprimée.");
      mutate();
    } catch {
      toast.error("Impossible de supprimer la commande.");
    }
  };

  const selectedMcpServers = useMemo(
    () => new Set(form.payload.serverIds ?? []),
    [form.payload.serverIds]
  );
  const selectedTools = useMemo(
    () => new Set(form.payload.toolIds ?? []),
    [form.payload.toolIds]
  );

  return (
    <div className="py-6 flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Commandes personnalisées</h2>
          <p className="text-sm text-muted-foreground">
            Créez vos propres commandes <code className="text-xs">/slash</code>{" "}
            ou <code className="text-xs">@mention</code> pour déclencher un
            serveur MCP, un agent, un skill, des outils, une navigation ou un
            prompt prédéfini.
          </p>
        </div>
        <Button
          onClick={() => (isFree ? setUpgradeOpen(true) : openCreate())}
          type="button"
        >
          <PlusIcon className="size-4 mr-1" />
          Nouvelle commande
        </Button>
      </div>

      {isFree ? (
        <div className="p-5 rounded-2xl border border-border/60 bg-muted/20 flex items-start gap-3">
          <SquareSlashIcon className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">
              Fonction réservée aux forfaits payants
            </p>
            <p>
              Passez au forfait Plus ou supérieur pour créer des commandes
              personnalisées et automatiser votre usage de mAI.
            </p>
          </div>
        </div>
      ) : commands.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
          Aucune commande personnalisée. Créez-en une pour commencer, par
          exemple <code className="text-xs">/traduire-en</code> qui injecte un
          prompt de traduction.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {commands.map((command) => {
            const prefix = command.kind === "slash" ? "/" : "@";
            return (
              <div
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/60"
                key={command.id}
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: command.color ?? "#6366f1" }}
                >
                  <AgentIcon icon={command.icon} size={16} variant="plain" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-semibold text-[13px] text-foreground">
                      {prefix}
                      {command.trigger}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {command.name}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {COMMAND_ACTION_LABELS[
                        command.actionType as CommandActionType
                      ] ?? command.actionType}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {command.kind === "slash" ? "Slash" : "Mention"}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {command.usageCount} usage(s)
                    </span>
                  </div>
                  {command.description && (
                    <p className="truncate text-xs text-muted-foreground/80">
                      {command.description}
                    </p>
                  )}
                </div>
                <label
                  className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground"
                  title={command.enabled ? "Désactiver" : "Activer"}
                >
                  <input
                    checked={command.enabled}
                    onChange={() => handleToggleEnabled(command)}
                    type="checkbox"
                  />
                  {command.enabled ? "Active" : "Inactive"}
                </label>
                <Button
                  onClick={() => openEdit(command)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Modifier
                </Button>
                <Button
                  onClick={() => handleDelete(command)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Supprimer
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal éditeur */}
      <Dialog onOpenChange={setEditorOpen} open={editorOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la commande" : "Nouvelle commande"}
            </DialogTitle>
            <DialogDescription>
              La commande apparaît dans le menu <code>/</code> ou <code>@</code>{" "}
              de la zone de saisie du chat.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Type de commande */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Type de commande *
              </Label>
              <Select
                onValueChange={(v) => setFormPartial({ kind: v as any })}
                value={form.kind}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slash">
                    Commande slash (ex. /traduire-en)
                  </SelectItem>
                  <SelectItem value="mention">
                    Mention @ (ex. @expert-seo)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Déclencheur + nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Déclencheur *{" "}
                  <span className="font-normal text-muted-foreground">
                    ({form.kind === "slash" ? "/" : "@"}…)
                  </span>
                </Label>
                <Input
                  maxLength={32}
                  onChange={(e) =>
                    setFormPartial({
                      trigger: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, "")
                        .slice(0, 32),
                    })
                  }
                  placeholder={
                    form.kind === "slash" ? "traduire-en" : "expert-seo"
                  }
                  value={form.trigger}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nom *</Label>
                <Input
                  maxLength={100}
                  onChange={(e) => setFormPartial({ name: e.target.value })}
                  placeholder="Traduction en anglais"
                  value={form.name}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                maxLength={500}
                onChange={(e) =>
                  setFormPartial({ description: e.target.value })
                }
                placeholder="Ce que fait la commande, visible dans le menu"
                value={form.description}
              />
            </div>

            {/* Icône + couleur */}
            <div className="space-y-2 rounded-xl border border-border/50 p-3 bg-muted/20">
              <Label className="text-xs font-semibold">Apparence</Label>
              <div className="grid grid-cols-5 gap-2">
                {AGENT_ICONS.map((o) => (
                  <button
                    className={cn(
                      "flex w-full flex-col items-center gap-1 p-2 rounded-xl border text-xs",
                      form.icon === o.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:bg-muted"
                    )}
                    key={o.id}
                    onClick={() => setFormPartial({ icon: o.id })}
                    type="button"
                  >
                    <span
                      className="flex size-8 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: form.color }}
                    >
                      <AgentIcon icon={o.id} size={16} variant="plain" />
                    </span>
                    <span className="text-[10px]">{o.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AGENT_COLORS.map((c) => (
                  <button
                    className={cn(
                      "size-6 rounded-full transition-transform",
                      form.color === c && "ring-2 ring-foreground scale-110"
                    )}
                    key={c}
                    onClick={() => setFormPartial({ color: c })}
                    style={{ backgroundColor: c }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Action déclenchée *
              </Label>
              <Select
                onValueChange={(v) =>
                  setFormPartial({
                    actionType: v as CommandActionType,
                    payload: {},
                  })
                }
                value={form.actionType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMAND_ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {COMMAND_ACTION_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payload par action */}
            {form.actionType === "prompt" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Consignes injectées au prochain message * (max 4000
                  caractères)
                </Label>
                <Textarea
                  maxLength={4000}
                  onChange={(e) =>
                    setFormPartial({
                      payload: { ...form.payload, promptText: e.target.value },
                    })
                  }
                  placeholder="Ex : Traduis la réponse suivante en anglais professionnel, avec un ton neutre."
                  rows={5}
                  value={form.payload.promptText ?? ""}
                />
              </div>
            )}

            {form.actionType === "agent" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Agent activé *</Label>
                <Select
                  onValueChange={(v) =>
                    setFormPartial({
                      payload: { ...form.payload, agentId: v },
                    })
                  }
                  value={form.payload.agentId ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.actionType === "skill" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Skill activé *</Label>
                <Select
                  onValueChange={(v) =>
                    setFormPartial({
                      payload: { ...form.payload, skillId: v },
                    })
                  }
                  value={form.payload.skillId ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.actionType === "mcp" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Serveurs MCP activés (prochain message)
                </Label>
                {mcpServers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun serveur MCP configuré. Ajoutez-en sur la page Serveurs
                    MCP.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-border/40 p-2">
                    {mcpServers.map((server) => (
                      <label
                        className="flex items-center gap-2 text-sm"
                        key={server.id}
                      >
                        <input
                          checked={selectedMcpServers.has(server.id)}
                          onChange={(e) => {
                            const next = new Set(selectedMcpServers);
                            if (e.target.checked) {
                              next.add(server.id);
                            } else {
                              next.delete(server.id);
                            }
                            setFormPartial({
                              payload: {
                                ...form.payload,
                                serverIds: [...next],
                              },
                            });
                          }}
                          type="checkbox"
                        />
                        {server.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.actionType === "tools" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Outils pré-activés (prochain message)
                </Label>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-border/40 p-2">
                  {TOOL_IDS.map((id) => (
                    <label className="flex items-center gap-2 text-sm" key={id}>
                      <input
                        checked={selectedTools.has(id)}
                        onChange={(e) => {
                          const next = new Set(selectedTools);
                          if (e.target.checked) {
                            next.add(id);
                          } else {
                            next.delete(id);
                          }
                          setFormPartial({
                            payload: { ...form.payload, toolIds: [...next] },
                          });
                        }}
                        type="checkbox"
                      />
                      {TOOLS_META[id].label}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      checked={selectedTools.has("mcp")}
                      onChange={(e) => {
                        const next = new Set(selectedTools);
                        if (e.target.checked) {
                          next.add("mcp");
                        } else {
                          next.delete("mcp");
                        }
                        setFormPartial({
                          payload: { ...form.payload, toolIds: [...next] },
                        });
                      }}
                      type="checkbox"
                    />
                    Outils MCP
                  </label>
                </div>
              </div>
            )}

            {form.actionType === "navigation" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Page de destination *
                </Label>
                <Select
                  onValueChange={(v) =>
                    setFormPartial({ payload: { ...form.payload, route: v } })
                  }
                  value={form.payload.route ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une page" />
                  </SelectTrigger>
                  <SelectContent>
                    {NAVIGATION_ROUTES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Aperçu */}
            <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 p-2.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {form.kind === "slash" ? "/" : "@"}
                {form.trigger || "…"}
              </span>
              <ArrowRightIcon className="size-3" />
              {COMMAND_ACTION_LABELS[form.actionType]}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setEditorOpen(false)}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button disabled={isSaving} onClick={handleSave} type="button">
              {isSaving
                ? "Enregistrement..."
                : editingId
                  ? "Enregistrer"
                  : "Créer la commande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        feature="generic"
        onOpenChange={setUpgradeOpen}
        open={upgradeOpen}
      />
    </div>
  );
}
