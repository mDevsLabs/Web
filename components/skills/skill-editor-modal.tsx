"use client";

import {
  CpuIcon,
  HistoryIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
  WrenchIcon,
  ZapIcon,
} from "@mdevs/icons";
import type React from "react";
import { toast } from "sonner";
import { AGENT_COLORS } from "@/components/agents/agent-presets";
import { ColorPicker } from "@/components/common/color-picker";
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
import type { Skill } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import type { SkillParameter } from "./starter-templates";
import { AVAILABLE_TOOLS } from "./starter-templates";

export function SkillEditorModal({
  open,
  onOpenChange,
  editingSkill,
  formName,
  onFormNameChange,
  formColor,
  onFormColorChange,
  formIcon,
  onFormIconChange,
  formDescription,
  onFormDescriptionChange,
  formInstructions,
  onFormInstructionsChange,
  formTools,
  onFormToolsChange,
  formTags,
  onFormTagsChange,
  formParameters,
  onFormParametersChange,
  formMcpServerIds,
  onFormMcpServerIdsChange,
  formMcpToolFilter,
  onFormMcpToolFilterChange,
  mcpServers,
  isSaving,
  onSaveSkill,
  onOpenVersionHistory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSkill: Skill | null;
  formName: string;
  onFormNameChange: (val: string) => void;
  formColor: string;
  onFormColorChange: (val: string) => void;
  formIcon?: string;
  onFormIconChange?: (val: string) => void;
  formDescription: string;
  onFormDescriptionChange: (val: string) => void;
  formInstructions: string;
  onFormInstructionsChange: (val: string) => void;
  formTools: string[];
  onFormToolsChange: (tools: string[]) => void;
  formTags: string;
  onFormTagsChange: (val: string) => void;
  formParameters: SkillParameter[];
  onFormParametersChange: (
    updater: (prev: SkillParameter[]) => SkillParameter[]
  ) => void;
  formMcpServerIds: string[];
  onFormMcpServerIdsChange: (updater: (prev: string[]) => string[]) => void;
  formMcpToolFilter: Record<string, string[] | null>;
  onFormMcpToolFilterChange: (filter: Record<string, string[] | null>) => void;
  mcpServers: any[];
  isSaving: boolean;
  onSaveSkill: (e: React.FormEvent) => void;
  onOpenVersionHistory: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSkill ? "Modifier le Skill" : "Créer un nouveau Skill"}
          </DialogTitle>
          <DialogDescription>
            Configurez le comportement, le prompt et les outils accessibles pour
            cette compétence.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4 py-2" onSubmit={onSaveSkill}>
          {/* Nom & Couleur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">
                Nom de la compétence *
              </Label>
              <Input
                onChange={(e) => onFormNameChange(e.target.value)}
                placeholder="Ex: Spécialiste SEO & Rédaction"
                required
                value={formName}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Couleur du badge</Label>
              <ColorPicker
                className="pt-1"
                colors={AGENT_COLORS}
                onChange={onFormColorChange}
                value={formColor}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description courte</Label>
            <Input
              onChange={(e) => onFormDescriptionChange(e.target.value)}
              placeholder="Rôle ou cas d'usage résumé..."
              value={formDescription}
            />
          </div>

          {/* Instructions Système */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Instructions système (Prompt du Skill) *
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Variables autorisées : {"{sujet}"}, {"{langue}"}, etc.
              </span>
            </div>
            <Textarea
              className="min-h-[140px] font-mono text-xs leading-relaxed"
              onChange={(e) => onFormInstructionsChange(e.target.value)}
              placeholder="Tu es un expert en... Tes réponses doivent toujours respecter..."
              required
              value={formInstructions}
            />
          </div>

          {/* Tester le Skill avec variables dynamiques */}
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ZapIcon className="size-3.5 text-amber-500" />
                Tester le Skill (variables dynamiques)
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Variables: {"{sujet}"}, {"{langue}"}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                className="h-8 text-xs bg-background"
                onChange={(e) =>
                  onFormInstructionsChange(
                    formInstructions.replace(/{testVar}/g, e.target.value)
                  )
                }
                placeholder="Valeur de test pour {testVar}..."
                value={"test"}
              />
              <Button
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  const preview = formInstructions
                    .replace(/{sujet}/g, "Intelligence Artificielle")
                    .replace(/{langue}/g, "Français")
                    .replace(/{testVar}/g, "test");
                  toast.info(
                    `Prévisualisation du prompt :\n${preview.slice(0, 300)}`
                  );
                }}
                type="button"
                variant="outline"
              >
                <PlayIcon className="size-3.5" />
                Tester
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Utilisez des variables entre accolades dans vos instructions. Le
              bouton "Tester" simule le rendu du prompt avec des valeurs par
              défaut pour vérifier le comportement.
            </p>
          </div>

          {/* Outils autorisés */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Outils associés à cette compétence
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_TOOLS.map((tool) => {
                const isChecked = formTools.includes(tool.id);
                const Icon = tool.icon;
                return (
                  <label
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer",
                      isChecked
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border/50 hover:bg-muted/30 text-muted-foreground"
                    )}
                    key={tool.id}
                  >
                    <input
                      checked={isChecked}
                      className="rounded border-border text-primary focus:ring-primary size-4"
                      onChange={(e) => {
                        if (e.target.checked) {
                          onFormToolsChange([...formTools, tool.id]);
                        } else {
                          onFormToolsChange(
                            formTools.filter((id) => id !== tool.id)
                          );
                        }
                      }}
                      type="checkbox"
                    />
                    <Icon className="size-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-xs block text-foreground">
                        {tool.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {tool.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* MCP Whitelist — visible si outil mcp coché */}
          {formTools.includes("mcp") && (
            <div className="space-y-3 p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/[0.04]">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CpuIcon className="size-3.5 text-purple-600" /> Serveurs MCP
                autorisés pour ce Skill (whitelist)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Cochez les serveurs que ce Skill pourra utiliser. Si aucun
                coché, le Skill n'aura accès à aucun MCP. Déroulez pour filtrer
                les outils per-serveur.
              </p>
              {mcpServers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun plugin MCP — créez-en dans Applications
                </p>
              ) : (
                <div className="space-y-2">
                  {mcpServers.map((srv: any) => {
                    const isChecked = formMcpServerIds.includes(srv.id);
                    const tools = (srv.toolsCache as any[]) ?? [];
                    const overrides = (srv.toolOverrides as any) ?? {};
                    const allowedTools = tools.filter(
                      (t) => overrides[t.name]?.enabled !== false
                    );
                    return (
                      <div
                        className={cn(
                          "rounded-xl border p-2.5",
                          isChecked
                            ? "border-purple-500/40 bg-purple-500/5"
                            : "border-border/40"
                        )}
                        key={srv.id}
                      >
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            checked={isChecked}
                            className="size-4 accent-purple-600"
                            onChange={(e) => {
                              if (e.target.checked) {
                                onFormMcpServerIdsChange((prev) => [
                                  ...prev,
                                  srv.id,
                                ]);
                              } else {
                                onFormMcpServerIdsChange((prev) =>
                                  prev.filter((id) => id !== srv.id)
                                );
                                const nf = { ...formMcpToolFilter };
                                delete nf[srv.id];
                                onFormMcpToolFilterChange(nf);
                              }
                            }}
                            type="checkbox"
                          />
                          <span className="text-xs font-semibold">
                            {srv.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({allowedTools.length} outils actifs)
                          </span>
                        </label>
                        {isChecked && allowedTools.length > 0 && (
                          <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                            {allowedTools.map((t: any) => {
                              const selected =
                                !formMcpToolFilter[srv.id] ||
                                (formMcpToolFilter[srv.id] ?? []).includes(
                                  t.name
                                );
                              return (
                                <label
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border cursor-pointer",
                                    selected
                                      ? "bg-purple-600 text-white border-purple-600"
                                      : "bg-muted text-muted-foreground border-border/40"
                                  )}
                                  key={t.name}
                                >
                                  <input
                                    checked={selected}
                                    className="hidden"
                                    onChange={(e) => {
                                      const cur =
                                        formMcpToolFilter[srv.id] ?? null;
                                      let next: string[] | null;
                                      if (cur === null) {
                                        next = allowedTools
                                          .map((x: any) => x.name)
                                          .filter((n: string) => n !== t.name);
                                      } else {
                                        next = e.target.checked
                                          ? [...cur, t.name]
                                          : cur.filter((n) => n !== t.name);
                                        if (
                                          next.length === allowedTools.length
                                        ) {
                                          next = null as any;
                                        }
                                      }
                                      onFormMcpToolFilterChange({
                                        ...formMcpToolFilter,
                                        [srv.id]: next as any,
                                      });
                                    }}
                                    type="checkbox"
                                  />
                                  {t.name}
                                </label>
                              );
                            })}
                            <button
                              className="text-[11px] underline text-muted-foreground"
                              onClick={() => {
                                const nf = { ...formMcpToolFilter };
                                delete nf[srv.id];
                                onFormMcpToolFilterChange(nf);
                              }}
                              type="button"
                            >
                              Tous
                            </button>
                            <button
                              className="text-[11px] underline text-muted-foreground"
                              onClick={() =>
                                onFormMcpToolFilterChange({
                                  ...formMcpToolFilter,
                                  [srv.id]: [],
                                })
                              }
                              type="button"
                            >
                              Aucun
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Parameters typés */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <WrenchIcon className="size-3.5 text-primary" /> Paramètres typés
              (variables {"{{param}}"})
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Définissez des variables utilisables dans les instructions via{" "}
              {"{{nom}}"} — type, requis, défaut, enum.
            </p>
            {formParameters.map((p, idx) => (
              <div
                className="grid grid-cols-12 gap-2 items-end p-2 rounded-xl border border-border/40 bg-muted/20"
                key={idx}
              >
                <div className="col-span-3 space-y-1">
                  <Label className="text-[11px]">Nom *</Label>
                  <Input
                    className="h-8 text-xs"
                    onChange={(e) =>
                      onFormParametersChange((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder="sujet"
                    value={p.name}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px]">Type</Label>
                  <select
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    onChange={(e) =>
                      onFormParametersChange((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, type: e.target.value } : x
                        )
                      )
                    }
                    value={p.type || "string"}
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="enum">enum</option>
                  </select>
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[11px]">Valeur défaut</Label>
                  <Input
                    className="h-8 text-xs"
                    onChange={(e) =>
                      onFormParametersChange((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, defaultValue: e.target.value } : x
                        )
                      )
                    }
                    placeholder="défaut"
                    value={p.defaultValue || ""}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-1.5 pt-6">
                  <input
                    checked={!!p.required}
                    className="size-4 accent-primary"
                    onChange={(e) =>
                      onFormParametersChange((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, required: e.target.checked } : x
                        )
                      )
                    }
                    type="checkbox"
                  />
                  <span className="text-xs">Requis</span>
                </div>
                <div className="col-span-2 flex gap-1">
                  <Button
                    className="h-8"
                    onClick={() =>
                      onFormParametersChange((prev) =>
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
                <div className="col-span-12 space-y-1">
                  <Label className="text-[11px]">Description</Label>
                  <Input
                    className="h-8 text-xs"
                    onChange={(e) =>
                      onFormParametersChange((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, description: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Description courte"
                    value={p.description}
                  />
                </div>
                {p.type === "enum" && (
                  <div className="col-span-12 space-y-1">
                    <Label className="text-[11px]">
                      Valeurs enum (séparées par virgules)
                    </Label>
                    <Input
                      className="h-8 text-xs"
                      onChange={(e) =>
                        onFormParametersChange((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  enumValues: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : x
                          )
                        )
                      }
                      placeholder="opt1, opt2, opt3"
                      value={(p.enumValues || []).join(", ")}
                    />
                  </div>
                )}
              </div>
            ))}
            <Button
              className="h-7 text-xs"
              onClick={() =>
                onFormParametersChange((prev) => [
                  ...prev,
                  {
                    defaultValue: "",
                    description: "",
                    name: "",
                    required: false,
                    type: "string",
                  },
                ])
              }
              size="sm"
              type="button"
              variant="outline"
            >
              <PlusIcon className="size-3 mr-1" />
              Ajouter un paramètre
            </Button>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Tags (séparés par des virgules)
            </Label>
            <Input
              onChange={(e) => onFormTagsChange(e.target.value)}
              placeholder="Dev, Marketing, Rédaction, Analyse..."
              value={formTags}
            />
          </div>

          <DialogFooter className="pt-2">
            {editingSkill && (
              <Button
                onClick={onOpenVersionHistory}
                size="sm"
                type="button"
                variant="outline"
              >
                <HistoryIcon className="size-3.5 mr-1" />
                Historique
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Enregistrement..." : "Enregistrer la compétence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
