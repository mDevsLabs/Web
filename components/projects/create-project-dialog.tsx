"use client";

import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { PROJECT_ICON_LIST } from "@/components/chat/project-icon";
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
import type { ModelCapabilities } from "@/lib/ai/models";

export const PROJECT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#84cc16",
];

type CreateProjectDialogProps = {
  open: boolean;
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
  onCreate: () => void;
};

export function CreateProjectDialog({
  open,
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
  onCreate,
}: CreateProjectDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>
            Créez un dossier pour organiser vos discussions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-project-name">Nom</Label>
            <Input
              id="create-project-name"
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Travail, Études..."
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-project-desc">Description</Label>
            <Input
              id="create-project-desc"
              maxLength={500}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optionnel"
              value={desc}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-project-instructions">
              Instructions personnalisées (optionnel)
            </Label>
            <textarea
              className="w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              id="create-project-instructions"
              maxLength={4000}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Répondre toujours en tant qu'expert TypeScript senior..."
              rows={3}
              value={instructions}
            />
            <span className="text-[11px] text-muted-foreground">
              Ces instructions seront appliquées à toutes les discussions créées
              dans ce dossier.
            </span>
          </div>
          <div className="grid gap-2">
            <Label id="create-project-model-label">
              Modèle d'IA par défaut (optionnel)
            </Label>
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
              <Label id="create-project-icon-label">Icône</Label>
              <div
                aria-labelledby="create-project-icon-label"
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
                      name="create-project-icon"
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
              <Label id="create-project-color-label">Couleur</Label>
              <div
                aria-labelledby="create-project-color-label"
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
                      name="create-project-color"
                      onChange={() => setColor(c)}
                      type="radio"
                      value={c}
                    />
                  </label>
                ))}
              </div>
              <Input
                aria-label="Sélecteur de couleur personnalisée"
                className="h-9 p-1"
                onChange={(e) => setColor(e.target.value)}
                type="color"
                value={color}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button onClick={onCreate}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
