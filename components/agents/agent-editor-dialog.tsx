"use client";

import {
  BrainIcon,
  CloudIcon,
  MessageSquareTextIcon,
  PinIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  ThermometerIcon,
  TriangleAlertIcon,
  XIcon,
} from "@mdevs/icons";
import type React from "react";
import { AgentIcon } from "@/components/agents/agent-icon";
import { AGENT_COLORS, AGENT_ICONS } from "@/components/agents/agent-presets";
import {
  INSTRUCTIONS_MAX_LENGTH,
  InstructionBuilder,
} from "@/components/agents/instruction-builder";
import { TemperatureControl } from "@/components/agents/temperature-control";
import { CloudFilePickerDialog } from "@/components/chat/cloud-file-picker-dialog";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { ColorPicker } from "@/components/common/color-picker";
import { MemoryCard } from "@/components/settings/memory-card";
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
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";
import type { Agent, McpServer, Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export interface AgentEditorDialogProps {
  addStarterPrompt: () => void;
  cloudFileNames: Record<string, string>;
  editingAgent: Agent | null;
  formCloudUrls: string[];
  formColor: string;
  formDescription: string;
  formIcon: string;
  formInstructions: string;
  formMaxTokens: string;
  formMcpIds: string[];
  formMemoryMode: "global" | "custom";
  formModelId: string;
  formName: string;
  formPinned: boolean;
  formSkillIds: string[];
  formStarterPrompts: string[];
  formTemperature: number;
  formTopP: number;
  formWelcomeMessage: string;
  isCloudPickerOpen: boolean;
  isSaving: boolean;
  mcpServers: McpServer[];
  models: any[];
  modelsData?: {
    capabilities: Record<string, ModelCapabilities>;
    models: unknown[];
  };
  onOpenChange: (open: boolean) => void;
  onSave: (e: React.FormEvent) => void;
  open: boolean;
  removeStarterPrompt: (idx: number) => void;
  saveError: string | null;
  setCloudFileNames: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  setFormCloudUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setFormColor: (val: string) => void;
  setFormDescription: (val: string) => void;
  setFormIcon: (val: string) => void;
  setFormInstructions: (val: string) => void;
  setFormMaxTokens: (val: string) => void;
  setFormMcpIds: React.Dispatch<React.SetStateAction<string[]>>;
  setFormMemoryMode: (val: "global" | "custom") => void;
  setFormModelId: (val: string) => void;
  setFormName: (val: string) => void;
  setFormPinned: (val: boolean) => void;
  setFormSkillIds: React.Dispatch<React.SetStateAction<string[]>>;
  setFormTemperature: (val: number) => void;
  setFormTopP: (val: number) => void;
  setFormWelcomeMessage: (val: string) => void;
  setIsCloudPickerOpen: (open: boolean) => void;
  skills: Skill[];
  updateStarterPrompt: (idx: number, val: string) => void;
}

export function AgentEditorDialog({
  open,
  onOpenChange,
  editingAgent,
  formName,
  setFormName,
  formDescription,
  setFormDescription,
  formInstructions,
  setFormInstructions,
  formIcon,
  setFormIcon,
  formColor,
  setFormColor,
  formModelId,
  setFormModelId,
  formSkillIds,
  setFormSkillIds,
  formMcpIds,
  setFormMcpIds,
  formCloudUrls,
  setFormCloudUrls,
  formTemperature,
  setFormTemperature,
  formTopP,
  setFormTopP,
  formMaxTokens,
  setFormMaxTokens,
  formStarterPrompts,
  updateStarterPrompt,
  removeStarterPrompt,
  addStarterPrompt,
  formWelcomeMessage,
  setFormWelcomeMessage,
  formPinned,
  setFormPinned,
  formMemoryMode,
  setFormMemoryMode,
  isSaving,
  saveError,
  onSave,
  skills,
  mcpServers,
  modelsData,
  models,
  isCloudPickerOpen,
  setIsCloudPickerOpen,
  cloudFileNames,
  setCloudFileNames,
}: AgentEditorDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-5xl sm:max-w-4xl lg:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
        {/* `pr-12` réserve l'espace du bouton de fermeture */}
        <DialogHeader className="pr-12">
          <DialogTitle>
            {editingAgent ? "Modifier le bot" : "Créer un bot"}
          </DialogTitle>
          <DialogDescription>
            Instructions ≤5000c, icône, paramètres du modèle, skills, MCP et
            fichiers.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4 py-2" onSubmit={onSave}>
          {saveError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
              <TriangleAlertIcon className="size-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Colonne formulaire */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Nom *</Label>
                  <Input
                    maxLength={100}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Assistant Code"
                    required
                    value={formName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Couleur du badge
                  </Label>
                  <ColorPicker
                    className="pt-1"
                    colors={AGENT_COLORS}
                    onChange={setFormColor}
                    value={formColor}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Description courte
                </Label>
                <Input
                  maxLength={500}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Rôle ou cas d'usage résumé..."
                  value={formDescription}
                />
              </div>

              {/* Sélecteur d'icône */}
              <div className="space-y-2 rounded-xl border border-border/50 p-3 bg-muted/20">
                <Label className="text-xs font-semibold">
                  Icône — affichée partout (sidebar, @, cartes, dropdown)
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {AGENT_ICONS.map((o) => (
                    <button
                      className={cn(
                        "flex w-full flex-col items-center gap-1 p-2 rounded-xl border text-xs",
                        formIcon === o.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:bg-muted"
                      )}
                      key={o.id}
                      onClick={() => setFormIcon(o.id)}
                      type="button"
                    >
                      <span
                        className="size-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: formColor }}
                      >
                        <AgentIcon icon={o.id} size={16} variant="plain" />
                      </span>
                      <span className="text-[10px]">{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  Instructions système *{" "}
                  <span
                    className={cn(
                      "text-[11px] font-normal",
                      formInstructions.length > 4800
                        ? "text-warning"
                        : "text-muted-foreground"
                    )}
                  >
                    {formInstructions.length}/5000
                  </span>
                </Label>
                <InstructionBuilder
                  onChange={setFormInstructions}
                  value={formInstructions}
                />
                <Textarea
                  className="min-h-[140px] font-mono text-xs leading-relaxed"
                  maxLength={INSTRUCTIONS_MAX_LENGTH}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Tu es un expert en…&#10;&#10;Rôle : …&#10;Ton : …&#10;Contraintes : …&#10;Interdits : …&#10;Format de sortie : …&#10;&#10;Ce que tu ne fais jamais : …"
                  required
                  value={formInstructions}
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Une consigne par ligne, la plus contraignante en premier. Ce
                  que le bot doit faire ET ce qu'il ne doit jamais faire : les
                  deux méritent la même place.
                </p>
              </div>

              {/* Mémoire du bot */}
              <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/30">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <BrainIcon className="size-3.5 text-muted-foreground" />
                  Mémoire du bot
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs",
                      formMemoryMode === "global"
                        ? "border-foreground/30 bg-foreground/5"
                        : "border-border/40 hover:bg-muted/30"
                    )}
                  >
                    <input
                      checked={formMemoryMode === "global"}
                      className="mt-0.5 size-3.5 accent-foreground"
                      name="agent-memory-mode"
                      onChange={() => setFormMemoryMode("global")}
                      type="radio"
                    />
                    <span className="flex flex-col">
                      <span className="font-semibold">Mémoire globale</span>
                      <span className="text-[11px] text-muted-foreground">
                        Partage la mémoire de vos Préférences IA
                      </span>
                    </span>
                  </label>
                  <label
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs",
                      formMemoryMode === "custom"
                        ? "border-foreground/30 bg-foreground/5"
                        : "border-border/40 hover:bg-muted/30"
                    )}
                  >
                    <input
                      checked={formMemoryMode === "custom"}
                      className="mt-0.5 size-3.5 accent-foreground"
                      name="agent-memory-mode"
                      onChange={() => setFormMemoryMode("custom")}
                      type="radio"
                    />
                    <span className="flex flex-col">
                      <span className="font-semibold">Mémoire dédiée</span>
                      <span className="text-[11px] text-muted-foreground">
                        Mémoire propre à cet agent uniquement
                      </span>
                    </span>
                  </label>
                </div>
                {formMemoryMode === "custom" &&
                  (editingAgent ? (
                    <MemoryCard agentId={editingAgent.id} />
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Enregistrez d'abord l'agent pour gérer sa mémoire dédiée.
                    </p>
                  ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Modèle IA par défaut — à l'activation, le modèle switch
                  automatiquement
                </Label>
                <ModelSelectorCompact
                  capabilities={modelsData?.capabilities}
                  fallbackModels={models}
                  modal
                  onModelChange={setFormModelId}
                  selectedModelId={formModelId}
                  variant="block"
                />
                <span className="text-[11px] text-muted-foreground">
                  Ce modèle sera appliqué automatiquement dès que l'agent est
                  activé.
                </span>
              </div>

              {/* Paramètres du modèle */}
              <div className="space-y-3 rounded-xl border border-border/50 p-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <SlidersHorizontalIcon className="size-4 text-primary" />
                  <Label className="text-xs font-semibold">
                    Paramètres du modèle
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <TemperatureControl
                    onChange={setFormTemperature}
                    reasoningModel={Boolean(
                      formModelId
                        ? modelsData?.capabilities?.[formModelId]?.reasoning
                        : false
                    )}
                    value={formTemperature}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center justify-between">
                      Top P{" "}
                      <span className="font-mono text-muted-foreground">
                        {formTopP.toFixed(2)}
                      </span>
                    </Label>
                    <input
                      className="w-full accent-primary"
                      max={1}
                      min={0}
                      onChange={(e) => setFormTopP(Number(e.target.value))}
                      step={0.05}
                      type="range"
                      value={formTopP}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Max tokens{" "}
                      <span className="text-muted-foreground font-normal">
                        (vide = défaut)
                      </span>
                    </Label>
                    <Input
                      className="h-8 text-xs"
                      max={1_000_000}
                      min={1}
                      onChange={(e) => setFormMaxTokens(e.target.value)}
                      placeholder="4096"
                      step={1}
                      type="number"
                      value={formMaxTokens}
                    />
                  </div>
                </div>
              </div>

              {/* Messages de démarrage */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <MessageSquareTextIcon className="size-3.5 text-primary" />
                  Messages de démarrage (max 10)
                </Label>
                {formStarterPrompts.map((p, idx) => (
                  <div className="flex items-center gap-2" key={idx}>
                    <Input
                      className="h-8 text-xs"
                      maxLength={500}
                      onChange={(e) => updateStarterPrompt(idx, e.target.value)}
                      placeholder={`Ex: Peux-tu m'aider à... (${idx + 1})`}
                      value={p}
                    />
                    <Button
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeStarterPrompt(idx)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  className="h-7 text-xs"
                  disabled={formStarterPrompts.length >= 10}
                  onClick={addStarterPrompt}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PlusIcon className="size-3 mr-1" />
                  Ajouter un message
                </Button>
              </div>

              {/* Message de bienvenue */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Message de bienvenue
                </Label>
                <Textarea
                  className="min-h-[70px] text-xs"
                  maxLength={2000}
                  onChange={(e) => setFormWelcomeMessage(e.target.value)}
                  placeholder="Bonjour ! Je suis ton assistant dédié. Comment puis-je t'aider ?"
                  value={formWelcomeMessage}
                />
              </div>

              {/* Épingler */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <PinIcon className="size-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">
                      Épingler cet agent
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      L'agent épinglé apparaît en tête de liste
                    </span>
                  </div>
                </div>
                <input
                  checked={formPinned}
                  className="size-4 accent-primary"
                  onChange={(e) => setFormPinned(e.target.checked)}
                  type="checkbox"
                />
              </label>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Skills associées (max 10)
                </Label>
                {skills.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Aucune skill — crée-en dans /skills
                  </span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 bg-muted/10">
                    {skills.map((s) => (
                      <label
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs",
                          formSkillIds.includes(s.id)
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/30 hover:bg-muted/30"
                        )}
                        key={s.id}
                      >
                        <input
                          checked={formSkillIds.includes(s.id)}
                          className="size-4 rounded border-border accent-primary"
                          onChange={(e) =>
                            e.target.checked
                              ? setFormSkillIds((prev) => [...prev, s.id])
                              : setFormSkillIds((prev) =>
                                  prev.filter((id) => id !== s.id)
                                )
                          }
                          type="checkbox"
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Serveurs MCP (max 10)
                </Label>
                {mcpServers.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Aucun serveur MCP — configure dans /mcp
                  </span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/40 rounded-xl p-2 bg-muted/10">
                    {mcpServers.map((m) => (
                      <label
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs",
                          formMcpIds.includes(m.id)
                            ? "border-border/60 bg-muted/30"
                            : "border-border/30 hover:bg-muted/30"
                        )}
                        key={m.id}
                      >
                        <input
                          checked={formMcpIds.includes(m.id)}
                          className="size-4 rounded border-border accent-primary"
                          onChange={(e) =>
                            e.target.checked
                              ? setFormMcpIds((prev) => [...prev, m.id])
                              : setFormMcpIds((prev) =>
                                  prev.filter((id) => id !== m.id)
                                )
                          }
                          type="checkbox"
                        />
                        <span className="truncate">{m.name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {m.transport}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <CloudIcon className="size-3.5 text-muted-foreground" />
                    Fichiers (max 10)
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {formCloudUrls.length}/10
                  </span>
                </Label>
                <Button
                  className="w-full h-8 text-[12px] border border-dashed border-border/60 bg-muted/40 hover:bg-muted/70 text-muted-foreground"
                  disabled={formCloudUrls.length >= 10}
                  onClick={() => setIsCloudPickerOpen(true)}
                  type="button"
                  variant="ghost"
                >
                  <CloudIcon className="size-3.5 mr-1.5" />
                  Depuis la bibliothèque
                </Button>
                {formCloudUrls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {formCloudUrls.map((url, i) => (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] border border-border/40 max-w-[220px]"
                        key={i}
                      >
                        <CloudIcon className="size-2.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {cloudFileNames[url] || url.split("/").pop() || url}
                        </span>
                        <button
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          onClick={() => {
                            setFormCloudUrls((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            );
                            setCloudFileNames((prev) => {
                              const copy = { ...prev };
                              delete copy[url];
                              return copy;
                            });
                          }}
                          type="button"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Dialog cloud picker */}
              <CloudFilePickerDialog
                onOpenChange={setIsCloudPickerOpen}
                onSelectAttachments={(attachments) => {
                  const toAdd = attachments.filter(
                    (a) => !formCloudUrls.includes(a.url)
                  );
                  const remaining = 10 - formCloudUrls.length;
                  const slice = toAdd.slice(0, remaining);
                  if (slice.length > 0) {
                    setFormCloudUrls((prev) => [
                      ...prev,
                      ...slice.map((a) => a.url),
                    ]);
                    setCloudFileNames((prev) => {
                      const copy = { ...prev };
                      for (const a of slice) {
                        copy[a.url] = a.name;
                      }
                      return copy;
                    });
                  }
                }}
                open={isCloudPickerOpen}
              />
            </div>

            {/* Colonne aperçu en direct */}
            <div className="lg:col-span-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aperçu en direct
              </Label>
              <div
                className={cn(
                  "mt-2 rounded-2xl border bg-card p-4 transition-colors",
                  formPinned && "border-foreground/30 ring-1 ring-foreground/10"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                      style={{ backgroundColor: formColor }}
                    >
                      <AgentIcon icon={formIcon} size={20} variant="plain" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                        {formName || "Nom du bot"}{" "}
                        {formPinned && (
                          <PinIcon className="size-3 text-muted-foreground shrink-0" />
                        )}
                      </h3>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {formDescription || "Aucune description"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-3 bg-muted/30 p-2.5 rounded-xl border border-border/30 overflow-hidden">
                  <p className="text-xs text-muted-foreground/90 line-clamp-3 font-mono break-words leading-relaxed">
                    {formInstructions || "Instructions système..."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border/40 text-[11px]">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                      {formModelId}
                    </span>
                    {formSkillIds.length ? (
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        Skills {formSkillIds.length}
                      </span>
                    ) : null}
                    {formMcpIds.length ? (
                      <span className="bg-info/10 text-info px-1.5 py-0.5 rounded">
                        MCP {formMcpIds.length}
                      </span>
                    ) : null}
                    {formCloudUrls.length ? (
                      <span className="bg-warning/10 text-warning px-1.5 py-0.5 rounded">
                        Fichiers {formCloudUrls.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <ThermometerIcon className="size-3 text-info" /> temp{" "}
                    {formTemperature.toFixed(1)} · topP {formTopP.toFixed(2)}
                    {formMaxTokens ? ` · max ${formMaxTokens}` : ""}
                  </div>
                  {formWelcomeMessage && (
                    <p className="text-[11px] italic text-muted-foreground line-clamp-2">
                      💬 {formWelcomeMessage}
                    </p>
                  )}
                  {formStarterPrompts.filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formStarterPrompts
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((p, i) => (
                          <span
                            className="text-[10px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full truncate max-w-full"
                            key={i}
                          >
                            {p}
                          </span>
                        ))}
                      {formStarterPrompts.filter(Boolean).length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{formStarterPrompts.filter(Boolean).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving
                ? "Enregistrement..."
                : editingAgent
                  ? "Mettre à jour"
                  : "Créer le bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
