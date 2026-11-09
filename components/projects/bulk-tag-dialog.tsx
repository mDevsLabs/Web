"use client";

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

type BulkTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  onApply: () => void;
};

export function BulkTagDialog({
  open,
  onOpenChange,
  tagInput,
  setTagInput,
  onApply,
}: BulkTagDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Étiqueter les discussions</DialogTitle>
          <DialogDescription>
            Séparez les tags par des virgules (max 10, 30 caractères).
          </DialogDescription>
        </DialogHeader>
        <Input
          aria-label="Tags des discussions à appliquer"
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="ex: urgent, travail, perso"
          value={tagInput}
        />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Annuler
          </Button>
          <Button onClick={onApply}>Appliquer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
