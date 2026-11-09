"use client";

import {
  CheckIcon,
  FolderKanbanIcon,
  GlobeIcon,
  Loader2Icon,
  PencilIcon,
  PowerIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "@mdevs/icons";
import { BotGlyph } from "@/components/agents/bot-avatar";
import { Button } from "@/components/ui/button";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatMemoryDate, type MemoryEntry, scopeLabel } from "./types";

type MemoryEntryRowProps = {
  entry: MemoryEntry;
  allScopes?: boolean;
  isEditing: boolean;
  editContent: string;
  editTagsInput: string;
  isUpdating: boolean;
  deletingId: string | null;
  onStartEdit: (entry: MemoryEntry) => void;
  onCancelEdit: () => void;
  onChangeContent: (value: string) => void;
  onChangeTags: (value: string) => void;
  onSaveEdit: () => void;
  onToggleImportant: (entry: MemoryEntry) => void;
  onToggleEnabled: (entry: MemoryEntry) => void;
  onRequestDelete: (entry: MemoryEntry) => void;
};

export function MemoryEntryRow({
  entry: m,
  allScopes,
  isEditing,
  editContent,
  editTagsInput,
  isUpdating,
  deletingId,
  onStartEdit,
  onCancelEdit,
  onChangeContent,
  onChangeTags,
  onSaveEdit,
  onToggleImportant,
  onToggleEnabled,
  onRequestDelete,
}: MemoryEntryRowProps) {
  const isEnabled = m.isEnabled !== false;
  const isImportant = Boolean(m.isImportant);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all p-3",
        !isEnabled && "opacity-60 bg-muted/10 border-border/30",
        isEnabled &&
          (isImportant
            ? "bg-warning/5 border-warning/30 shadow-xs"
            : "bg-muted/20 border-border/40 hover:border-border/70")
      )}
    >
      {isEditing ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            aria-label="Modifier le contenu de la mémoire"
            className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            maxLength={MEMORY_CONTENT_MAX_LENGTH}
            onChange={(e) => onChangeContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                onSaveEdit();
              }
              if (e.key === "Escape") {
                onCancelEdit();
              }
            }}
            rows={3}
            value={editContent}
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                aria-label="Modifier les tags de la mémoire"
                className="h-7 w-32 rounded-lg border border-border/60 bg-background px-2 text-[11px] outline-none"
                onChange={(e) => onChangeTags(e.target.value)}
                placeholder="Tags séparés par virgule"
                value={editTagsInput}
              />
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                className="h-7 px-2 text-xs gap-1"
                onClick={onCancelEdit}
                size="sm"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-3" /> Annuler
              </Button>
              <Button
                className="h-7 px-3 text-xs gap-1 bg-primary text-primary-foreground"
                disabled={isUpdating || !editContent.trim()}
                onClick={onSaveEdit}
                size="sm"
                type="button"
              >
                {isUpdating ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <CheckIcon className="size-3" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5">
          <button
            className={cn(
              "mt-0.5 p-1 rounded-md transition-colors cursor-pointer shrink-0",
              isImportant
                ? "text-warning fill-warning hover:text-warning/80"
                : "text-muted-foreground/40 hover:text-warning"
            )}
            onClick={() => onToggleImportant(m)}
            title={
              isImportant
                ? "Mémoire Importante (injectée en priorité)"
                : "Marquer comme importante"
            }
            type="button"
          >
            <StarIcon className={cn("size-4", isImportant && "fill-current")} />
          </button>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs leading-relaxed text-foreground break-words",
                !isEnabled && "line-through text-muted-foreground"
              )}
            >
              {m.content}
            </p>

            <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10.5px]">
              {m.tags && m.tags.length > 0
                ? m.tags.map((t) => (
                    <span
                      className="bg-info/10 text-info px-1.5 py-0.5 rounded font-mono text-[10px]"
                      key={t}
                    >
                      #{t}
                    </span>
                  ))
                : null}

              {allScopes ? (
                <span className="text-muted-foreground">
                  {m.agentId ? (
                    <BotGlyph className="size-3 inline -mt-0.5 mr-0.5" />
                  ) : m.projectId ? (
                    <FolderKanbanIcon className="size-3 inline -mt-0.5 mr-0.5" />
                  ) : (
                    <GlobeIcon className="size-3 inline -mt-0.5 mr-0.5" />
                  )}
                  {scopeLabel(m)} ·{" "}
                </span>
              ) : null}

              <span className="text-muted-foreground/70">
                {formatMemoryDate(m.createdAt)}
              </span>

              {isEnabled ? null : (
                <span className="bg-warning/10 text-warning font-semibold px-1.5 py-0.5 rounded">
                  Suspendue
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                isEnabled
                  ? "text-success hover:bg-success/10"
                  : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => onToggleEnabled(m)}
              title={
                isEnabled
                  ? "Désactiver temporairement cette mémoire"
                  : "Réactiver cette mémoire"
              }
              type="button"
            >
              <PowerIcon className="size-3.5" />
            </button>

            <button
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={() => onStartEdit(m)}
              title="Modifier"
              type="button"
            >
              <PencilIcon className="size-3.5" />
            </button>

            <button
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              disabled={deletingId === m.id}
              onClick={() => onRequestDelete(m)}
              title="Supprimer"
              type="button"
            >
              {deletingId === m.id ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <Trash2Icon className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
