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
import type { Agent } from "@/lib/db/schema";

export interface AgentDeleteDialogProps {
  agentToDelete: Agent | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function AgentDeleteDialog({
  agentToDelete,
  onClose,
  onConfirmDelete,
}: AgentDeleteDialogProps) {
  return (
    <AlertDialog
      onOpenChange={(open) => !open && onClose()}
      open={Boolean(agentToDelete)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce bot ?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement le bot "
            {agentToDelete?.name}" ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirmDelete}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
