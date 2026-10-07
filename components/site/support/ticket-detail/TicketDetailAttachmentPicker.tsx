"use client";

import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import type { SupportAttachment } from "@/app/(chat)/site/actions/support-utils";
import { SUPPORT_ATTACHMENT_LIMITS } from "@/app/(chat)/site/actions/support-utils";

export function TicketDetailAttachmentPicker({
  attachments,
  uploading,
  canUploadMore,
  myAttachmentsCount,
  role,
  fileInputRef,
  onFilesSelected,
  onRemove,
}: {
  attachments: SupportAttachment[];
  uploading: boolean;
  canUploadMore: boolean;
  myAttachmentsCount: number;
  role: "user" | "admin";
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList | null) => void | Promise<void>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Paperclip aria-hidden="true" className="h-3.5 w-3.5" /> Fichiers
          (images / .txt / .md) — 8 Mo max,{" "}
          {SUPPORT_ATTACHMENT_LIMITS.MAX_FILES_PER_ROLE_PER_TICKET} max /{" "}
          {role === "admin" ? "admin" : "vous"} • {myAttachmentsCount}/
          {SUPPORT_ATTACHMENT_LIMITS.MAX_FILES_PER_ROLE_PER_TICKET}
        </span>
        <span
          className={`text-[11px] font-bold ${canUploadMore ? "text-emerald-600" : "text-red-600"}`}
        >
          {canUploadMore ? "Upload disponible" : "Limite atteinte"}
        </span>
      </div>
      <div
        className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-xs transition-all hover:border-purple-300 hover:bg-white sm:flex-row"
        onDragLeave={(event) =>
          event.currentTarget.classList.remove(
            "border-purple-400",
            "bg-purple-50"
          )
        }
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add(
            "border-purple-400",
            "bg-purple-50"
          );
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.currentTarget.classList.remove(
            "border-purple-400",
            "bg-purple-50"
          );
          void onFilesSelected(event.dataTransfer.files);
        }}
      >
        <input
          accept="image/*,.txt,.md,text/plain,text/markdown"
          aria-label="Sélectionner des pièces jointes"
          className="sr-only"
          multiple
          onChange={(event) => void onFilesSelected(event.target.files)}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-purple-300 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canUploadMore || uploading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-purple-600"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="h-4 w-4 text-purple-600" />
          )}
          {uploading ? "Upload Z1…" : "Choisir / Glisser fichiers"}
        </button>
        <span className="text-slate-500">
          ou glissez-déposez ici • 8 Mo max • images, .txt, .md
        </span>
      </div>
      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <div
              className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 p-2 text-xs"
              key={attachment.id}
            >
              <div className="min-w-0 flex-1">
                {attachment.mime_type.startsWith("image/") ? (
                  <img
                    alt=""
                    className="mb-1 h-10 w-10 rounded-lg bg-white object-cover"
                    src={attachment.file_url}
                  />
                ) : (
                  <FileText
                    aria-hidden="true"
                    className="mb-1 h-5 w-5 shrink-0 text-purple-600"
                  />
                )}
                <p className="truncate font-bold">{attachment.file_name}</p>
                <p className="text-[11px] text-slate-500">
                  {(attachment.file_size / 1024).toFixed(1)} Ko — prêt à envoyer
                </p>
              </div>
              <button
                aria-label={`Retirer ${attachment.file_name}`}
                className="cursor-pointer rounded-lg p-1 hover:bg-white"
                onClick={() => onRemove(attachment.id)}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {canUploadMore ? null : (
        <p className="text-[11px] text-red-600">
          Vous avez atteint la limite de{" "}
          {SUPPORT_ATTACHMENT_LIMITS.MAX_FILES_PER_ROLE_PER_TICKET} fichiers
          pour cette conversation en tant que {role}.
        </p>
      )}
    </div>
  );
}
