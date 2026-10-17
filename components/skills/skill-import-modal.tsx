"use client";

import { UploadIcon } from "@mdevs/icons";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SkillImportModal({
  open,
  onOpenChange,
  importJsonText,
  onImportJsonChange,
  onFileUpload,
  onProcessImport,
  fileInputRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importJsonText: string;
  onImportJsonChange: (val: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessImport: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importer un Skill</DialogTitle>
          <DialogDescription>
            Téléversez un fichier JSON/Skill ou collez son contenu directement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Zone drag & drop / fichier */}
          <div
            className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="size-8 mx-auto text-muted-foreground mb-2" />
            <span className="text-xs font-semibold block">
              Cliquez pour choisir un fichier (.json ou .skill)
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1">
              Format d'export standard mAI Web
            </span>
            <input
              accept=".json,.skill"
              className="hidden"
              onChange={onFileUpload}
              ref={fileInputRef}
              type="file"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ou collez le JSON :</Label>
            <Textarea
              className="h-32 font-mono text-xs"
              onChange={(e) => onImportJsonChange(e.target.value)}
              placeholder='{"name": "Mon Skill", "instructions": "...", "tools": []}'
              value={importJsonText}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
              onImportJsonChange("");
            }}
            type="button"
            variant="outline"
          >
            Annuler
          </Button>
          <Button onClick={onProcessImport} type="button">
            Importer la compétence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
