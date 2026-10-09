"use client";

import { BotIcon as Bot, LightbulbIcon as Lightbulb, Loader2Icon as Loader2, SendIcon as Send } from "@mdevs/icons";
import type { SupportTicketStatus } from "@/app/(chat)/site/actions/support-utils";
import { getAllowedStatusTransitions } from "@/app/(chat)/site/actions/support-utils";
import { TicketDetailAttachmentPicker } from "@/components/site/support/ticket-detail/TicketDetailAttachmentPicker";
import type { TicketReplyComposerProps } from "@/components/site/support/ticket-detail/ticket-detail-types";

const ALL_STATUSES: Array<{ value: SupportTicketStatus; label: string }> = [
  { label: "Ouvert", value: "open" },
  { label: "En cours", value: "in_progress" },
  { label: "En attente de l'utilisateur", value: "waiting_user" },
  { label: "Résolu", value: "resolved" },
  { label: "Fermé", value: "closed" },
  { label: "Réouvert", value: "reopened" },
  { label: "Archivé", value: "archived" },
];

export function TicketReplyComposer({
  ticket,
  isAdmin,
  myRole,
  selectedStatus,
  replyText,
  isAiGenerated,
  submitting,
  uploading,
  canUploadMore,
  myAttachmentsCount,
  pendingAttachments,
  fileInputRef,
  onSelectedStatusChange,
  onReplyTextChange,
  onAiGeneratedChange,
  onFilesSelected,
  onRemoveAttachment,
  onSubmit,
}: TicketReplyComposerProps) {
  const isTerminal = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Send aria-hidden="true" className="h-4 w-4 text-purple-600" />{" "}
          Répondre
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden font-medium text-slate-500 sm:inline">
            Statut :
          </span>
          <label className="sr-only" htmlFor="ticket-reply-status">
            Statut du ticket après réponse
          </label>
          <select
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-purple-500"
            id="ticket-reply-status"
            onChange={(event) =>
              onSelectedStatusChange(
                event.target.value as SupportTicketStatus | ""
              )
            }
            value={selectedStatus}
          >
            {ALL_STATUSES.map((status) => {
              const isAllowed = getAllowedStatusTransitions(
                ticket.status
              ).includes(status.value);
              const disabled = !isAllowed;
              return (
                <option
                  disabled={disabled}
                  key={status.value}
                  style={disabled ? { color: "#94a3b8" } : undefined}
                  value={status.value}
                >
                  {status.label} {disabled ? "— indisponible (fermé)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {isTerminal &&
      selectedStatus !== "reopened" &&
      selectedStatus !== ticket.status ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Ce ticket est fermé/résolu. Seule l&apos;option{" "}
          <strong>Réouvert</strong> est disponible (autres options grisées).
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="ticket-reply-text">
          Votre réponse
        </label>
        <textarea
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
          id="ticket-reply-text"
          onChange={(event) => onReplyTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey))
              onSubmit();
          }}
          placeholder={
            isAdmin
              ? "Réponse officielle mAI… (e-mail auto)"
              : "Précisions ou confirmation… (Ctrl+Entrée)"
          }
          rows={4}
          value={replyText}
        />

        <TicketDetailAttachmentPicker
          attachments={pendingAttachments}
          canUploadMore={canUploadMore}
          fileInputRef={fileInputRef}
          myAttachmentsCount={myAttachmentsCount}
          onFilesSelected={onFilesSelected}
          onRemove={onRemoveAttachment}
          role={myRole}
          uploading={uploading}
        />

        {isAdmin ? (
          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <input
              checked={isAiGenerated}
              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-purple-600 focus:ring-purple-500"
              onChange={(event) => onAiGeneratedChange(event.target.checked)}
              type="checkbox"
            />
            <span className="text-xs leading-relaxed text-amber-900">
              <strong className="flex items-center gap-1">
                <Bot aria-hidden="true" className="h-3.5 w-3.5" /> Contenu créé
                par IA
              </strong>
              Cochez si ce message a été généré avec l&apos;assistance de
              l&apos;IA. Un badge sera affiché à l&apos;utilisateur indiquant
              que le contenu est peut-être créé par IA.
            </span>
          </label>
        ) : null}

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[11px] text-slate-400">
            <Lightbulb
              aria-hidden="true"
              className="mr-0.5 inline h-3 w-3 align-middle text-amber-400"
            />{" "}
            <kbd className="rounded border bg-slate-100 px-1.5 py-0.5 text-[10px]">
              Ctrl + Entrée
            </kbd>{" "}
            pour envoyer. Purge auto après 365j d&apos;inactivité (fichiers Z1
            inclus).
          </p>
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            disabled={
              submitting ||
              uploading ||
              (!replyText.trim() &&
                pendingAttachments.length === 0 &&
                selectedStatus === ticket.status)
            }
            type="submit"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />{" "}
                Envoi…
              </>
            ) : (
              <>
                <Send aria-hidden="true" className="h-4 w-4" /> Envoyer la
                réponse
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
