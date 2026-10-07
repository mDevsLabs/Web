"use client";

import { Edit3, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function TicketProblemStep({
  title,
  description,
  previewMode,
  onTitleChange,
  onDescriptionChange,
  onPreviewModeChange,
}: {
  title: string;
  description: string;
  previewMode: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPreviewModeChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            htmlFor="ticket-title"
          >
            Objet / titre <span className="text-red-500">*</span>
          </label>
          <span aria-live="polite" className="text-[11px] text-slate-400">
            {title.length}/120
          </span>
        </div>
        <input
          aria-describedby="ticket-title-help"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
          id="ticket-title"
          maxLength={120}
          name="title"
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Ex. Erreur HTTP 429 sur /v1/chat/completions…"
          required
          type="text"
          value={title}
        />
        <p className="text-[11px] text-slate-400" id="ticket-title-help">
          Résumez le problème en 3 à 120 caractères.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            htmlFor="ticket-description"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <fieldset
            aria-label="Mode de saisie de la description"
            className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border-0 m-0"
          >
            <button
              aria-pressed={!previewMode}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${previewMode ? "text-slate-500" : "bg-white text-slate-900 shadow-2xs"}`}
              onClick={() => onPreviewModeChange(false)}
              type="button"
            >
              <Edit3 aria-hidden="true" className="h-3.5 w-3.5" /> Rédiger
            </button>
            <button
              aria-pressed={previewMode}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${previewMode ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"}`}
              onClick={() => onPreviewModeChange(true)}
              type="button"
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" /> Aperçu
            </button>
          </fieldset>
        </div>
        {previewMode ? (
          <div
            aria-label="Aperçu Markdown de la description"
            className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800 prose prose-sm max-w-none"
          >
            {description.trim() ? (
              <ReactMarkdown>{description}</ReactMarkdown>
            ) : (
              <p className="text-xs italic text-slate-400">Aucun texte.</p>
            )}
          </div>
        ) : (
          <textarea
            aria-describedby="ticket-description-help"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
            id="ticket-description"
            name="description"
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Décrivez : 1. Que faisiez-vous ? 2. Quel résultat attendiez-vous ? 3. Quelle erreur est apparue ?"
            required
            rows={8}
            value={description}
          />
        )}
        <p className="text-[11px] text-slate-400" id="ticket-description-help">
          Markdown accepté : listes, gras et blocs de code facilitent la
          reproduction. 15 caractères minimum.
        </p>
      </div>
    </div>
  );
}
