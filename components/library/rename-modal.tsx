import React from "react";
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
import type { CloudFile } from "./library-types";

export function RenameModal({
  fileToRename,
  setFileToRename,
  newName,
  setNewName,
  handleRenameSubmit,
  isRenaming,
}: {
  fileToRename: CloudFile | null;
  setFileToRename: (file: CloudFile | null) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleRenameSubmit: (e: React.FormEvent) => void;
  isRenaming: boolean;
}) {
  return (
    <Dialog
      onOpenChange={(open) => !open && setFileToRename(null)}
      open={Boolean(fileToRename)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renommer le fichier</DialogTitle>
          <DialogDescription>
            Modifiez le nom d'affichage de votre document Cloud.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-2" onSubmit={handleRenameSubmit}>
          <div className="space-y-2">
            <Input
              autoFocus
              className="rounded-xl text-xs"
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nouveau nom de fichier…"
              value={newName}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={isRenaming}
              onClick={() => setFileToRename(null)}
              type="button"
              variant="outline"
            >
              Annuler
            </Button>
            <Button disabled={isRenaming || !newName.trim()} type="submit">
              {isRenaming ? "Enregistrement…" : "Renommer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
