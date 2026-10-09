"use client";

import { ArchiveIcon as Archive, ArchiveRestoreIcon as ArchiveRestore, RotateCcwIcon as RotateCcw, Trash2Icon as Trash2 } from "@mdevs/icons";
import type {
  SupportTicket,
  SupportTicketStatus,
} from "@/app/(chat)/site/actions/support-utils";

export function TicketActions({
  ticket,
  isTerminal,
  submitting,
  onQuickStatus,
  onArchiveToggle,
  onDelete,
}: {
  ticket: SupportTicket;
  isTerminal: boolean;
  submitting: boolean;
  onQuickStatus: (status: SupportTicketStatus) => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  const isArchived = ticket.is_archived || ticket.status === "archived";

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {isTerminal ? (
        <button
          className="flex cursor-pointer items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-40"
          disabled={submitting}
          onClick={() => onQuickStatus("reopened")}
          type="button"
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Rouvrir
        </button>
      ) : ticket.status !== "resolved" && ticket.status !== "closed" ? (
        <button
          className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
          disabled={submitting}
          onClick={() => onQuickStatus("resolved")}
          type="button"
        >
          Marquer résolu
        </button>
      ) : null}
      <button
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        disabled={submitting}
        onClick={onArchiveToggle}
        type="button"
      >
        {isArchived ? (
          <ArchiveRestore aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Archive aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {isArchived ? "Désarchiver" : "Archiver"}
      </button>
      <button
        aria-label="Supprimer définitivement"
        className="cursor-pointer rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-40"
        disabled={submitting}
        onClick={onDelete}
        title="Supprimer définitivement"
        type="button"
      >
        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
