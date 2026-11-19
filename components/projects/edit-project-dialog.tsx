"use client";

import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { PROJECT_ICON_LIST } from "@/components/chat/project-icon";
import { MemoryCard } from "@/components/settings/memory-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModelCapabilities } from "@/lib/ai/models";
import { PROJECT_COLORS } from "./create-project-dialog";

type ProjectLike = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  customInstructions?: string | null;
  defaultModel?: string | null;
};

type EditProjectDialogProps = {
  project: ProjectLike | null;
  onOpenChange: (open: boolean) => void;
  name: string;
  setName: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  instructions: string;
  setInstructions: (v: string) => void;
  defaultModel: string;
  setDefaultModel: (v: string) => void;
  icon: string;
  setIcon: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  modelsData?: { capabilities?: Record<string, ModelCapabilities> };
  availableModels: Array<{ id: string; name: string }>;
  onUpdate: () => void;
};

export function EditProjectDialog({
  project,
  onOpenChange,
  name,
  setName,
  desc,
  setDesc,
  instructions,
  setInstructions,
  defaultModel,
  setDefaultModel,
  icon,
  setIcon,
  color,
  setColor,
  modelsData,
  availableModels,
  onUpdate,
}: EditProjectDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(project)}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-project-name">Nom</Label>
            <Input
              id="edit-project-name"
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-project-desc">Description</Label>
            <Input
              id="edit-project-desc"
              onChange={(e) => setDesc(e.target.value)}
              value={desc}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-project-instructions">
              Instructions personnalisées du dossier
            </Label>
            <textarea
              className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              id="edit-project-instructions"
              maxLength={4000}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Contexte, rôle IA, règles spécifiques..."
              rows={3}
              value={instructions}
            />
            <span className="text-[11px] text-muted-foreground">
              Injectées automatiquement comme contexte pour les échanges dans ce
              projet.
            </span>
          </div>
          {project ? (
            <div className="grid gap-2">
              <Label>Mémoire du projet</Label>
              <MemoryCard projectId={project.id} />
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label id="edit-project-model-label">Modèle d'IA par défaut</Label>
            <ModelSelectorCompact
              allowEmpty
              capabilities={modelsData?.capabilities}
              fallbackModels={availableModels}
              modal
              models={availableModels.length > 0 ? availableModels : undefined}
              onModelChange={setDefaultModel}
              selectedModelId={defaultModel}
              variant="block"
            />
            <span className="text-[11px] text-muted-foreground">
              Modèle utilisé par défaut pour chaque nouvelle discussion lancée
              dans ce projet.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label id="edit-project-icon-label">Icône</Label>
              <div
                aria-labelledby="edit-project-icon-label"
                className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-lg border bg-muted/20"
                role="radiogroup"
              >
                {PROJECT_ICON_LIST.map(({ id, label, icon: IconComp }) => (
                  <label
                    className={`h-8 rounded flex items-center justify-center gap-1.5 text-xs transition-all border cursor-pointer focus-within:ring-2 focus-within:ring-ring ${
                      icon === id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                        : "bg-card border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    key={id}
                    title={label}
                  >
                    <input
                      aria-label={`Icône ${label}`}
                      checked={icon === id}
                      className="sr-only"
                      name="edit-project-icon"
                      onChange={() => setIcon(id)}
                      type="radio"
                      value={id}
                    />
                    <IconComp className="size-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label id="edit-project-color-label">Couleur</Label>
              <div
                aria-labelledby="edit-project-color-label"
                className="flex flex-wrap gap-1.5"
                role="radiogroup"
              >
                {PROJECT_COLORS.map((c) => (
                  <label
                    aria-label={`Couleur ${c}`}
                    className={`size-8 rounded-full border-2 cursor-pointer transition-transform focus-within:ring-2 focus-within:ring-ring ${
                      color === c
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    key={c}
                    style={{ background: c }}
                    title={c}
                  >
                    <input
                      aria-label={`Couleur ${c}`}
                      checked={color === c}
                      className="sr-only"
                      name="edit-project-color"
                      onChange={() => setColor(c)}
                      type="radio"
                      value={c}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button onClick={onUpdate}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
