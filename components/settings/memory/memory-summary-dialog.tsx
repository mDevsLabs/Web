"use client";

import { BrainIcon, CopyIcon } from "@mdevs/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MemorySummaryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summaryCount: number;
  summaryText: string;
};

export function MemorySummaryDialog({
  open,
  onOpenChange,
  summaryCount,
  summaryText,
}: MemorySummaryDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-info/10 text-info">
              <BrainIcon className="size-4" />
            </span>
            <DialogTitle>Synthèse de votre Mémoire</DialogTitle>
          </div>
          <DialogDescription>
            Synthèse structurée de vos {summaryCount} informations mémorisées,
            organisée par sections.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[50vh] rounded-xl border border-border/50 bg-muted/20 p-4 text-xs leading-relaxed text-foreground space-y-3 whitespace-pre-wrap font-sans">
          {summaryText}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(summaryText);
              toast.success("Synthèse copiée dans le presse-papiers!");
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <CopyIcon className="size-3.5" />
            <span>Copier la synthèse</span>
          </Button>
          <Button onClick={() => onOpenChange(false)} size="sm" type="button">
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
