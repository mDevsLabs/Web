"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteWithChats: boolean;
  setDeleteWithChats: (v: boolean) => void;
  chatCount: number;
  onDelete: () => void;
};

export function DeleteProjectDialog({
  open,
  onOpenChange,
  deleteWithChats,
  setDeleteWithChats,
  chatCount,
  onDelete,
}: DeleteProjectDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les discussions ne seront pas supprimées sauf si vous cochez
            l&apos;option. Elles redeviendront &quot;Sans dossier&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2 py-2">
          <input
            checked={deleteWithChats}
            id="deleteChats"
            onChange={(e) => setDeleteWithChats(e.target.checked)}
            type="checkbox"
          />
          <label className="text-sm cursor-pointer" htmlFor="deleteChats">
            Supprimer aussi les {chatCount} discussions du projet
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground"
            onClick={onDelete}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
