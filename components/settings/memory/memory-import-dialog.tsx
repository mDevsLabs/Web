"use client";

import {
  AlertCircleIcon,
  FileJsonIcon,
  Loader2Icon,
  StarIcon,
  UploadIcon,
} from "@mdevs/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MemoryEntry } from "./types";

type MemoryImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingImportData: MemoryEntry[] | null;
  scopeCount: number;
  limit: number;
  remainingSlots: number;
  isImporting: boolean;
  onConfirmImport: () => void;
  onCancel: () => void;
};

export function MemoryImportDialog({
  open,
  onOpenChange,
  pendingImportData,
  scopeCount,
  limit,
  remainingSlots,
  isImporting,
  onConfirmImport,
  onCancel,
}: MemoryImportDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info">
              <FileJsonIcon className="size-4" />
            </span>
            <DialogTitle>Importer des mémoires (JSON)</DialogTitle>
          </div>
          <DialogDescription>
            Vérifiez les éléments à importer dans votre profil mAI.
          </DialogDescription>
        </DialogHeader>

        {pendingImportData ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 border border-border/50 text-xs">
              <div>
                <p className="font-semibold text-foreground">
                  {pendingImportData.length} élément(s) détecté(s)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Quota actuel: {scopeCount}/{limit} ({remainingSlots} place(s)
                  restante(s))
                </p>
              </div>
              {pendingImportData.length > remainingSlots ? (
                <span className="text-[11px] bg-destructive/10 text-destructive font-semibold px-2 py-1 rounded-md">
                  Dépassement de quota
                </span>
              ) : (
                <span className="text-[11px] bg-success/10 text-success font-semibold px-2 py-1 rounded-md">
                  Compatible
                </span>
              )}
            </div>

            {pendingImportData.length > remainingSlots ? (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                <p>
                  Le fichier contient plus de mémoires que votre quota
                  disponible. Veuillez passer à un forfait supérieur (Plus, Pro
                  ou Max) ou réduire le fichier JSON.
                </p>
              </div>
            ) : null}

            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-border/40 p-2.5 bg-background">
              {pendingImportData.slice(0, 5).map((item, i) => (
                <div
                  className="rounded-lg bg-muted/20 p-2 text-[11.5px] text-foreground border border-border/30 flex items-start gap-2"
                  key={i}
                >
                  <span className="text-muted-foreground font-mono">
                    {i + 1}.
                  </span>
                  <span className="flex-1 line-clamp-2">{item.content}</span>
                  {item.isImportant ? (
                    <StarIcon className="size-3 fill-warning text-warning shrink-0 mt-0.5" />
                  ) : null}
                </div>
              ))}
              {pendingImportData.length > 5 ? (
                <p className="text-center text-[10.5px] text-muted-foreground pt-1">
                  ... et {pendingImportData.length - 5} autre(s) mémoire(s).
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={onCancel} type="button" variant="outline">
            Annuler
          </Button>
          <Button
            className="bg-primary text-primary-foreground gap-1.5"
            disabled={
              isImporting ||
              !pendingImportData ||
              pendingImportData.length === 0 ||
              pendingImportData.length > remainingSlots
            }
            onClick={onConfirmImport}
            type="button"
          >
            {isImporting ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <UploadIcon className="size-3.5" />
            )}
            <span>Confirmer l'import</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
