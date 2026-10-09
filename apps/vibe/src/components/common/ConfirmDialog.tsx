/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CONFIRM DIALOG (src/components/common/ConfirmDialog.tsx)
 * Confirmation in-app thémée (clair/sombre) remplaçant les dialogues natifs
 * (window.confirm / window.prompt) : tons par défaut et danger, mode saisie
 * optionnel (ex. URL de lien). Styles alignés sur les modales de Messages.
 * ============================================================================
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangleIcon as AlertTriangle } from "@mdevs/icons";

export interface ConfirmDialogInput {
  type?: 'text' | 'url';
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  input?: ConfirmDialogInput;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'default',
  input,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(input?.initialValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setValue(input?.initialValue || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && input) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open, input]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const disabled = Boolean(input) && !value.trim();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-3 animate-scaleUp text-zinc-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {tone === 'danger' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        {message && <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{message}</p>}
        {input && (
          <input
            ref={inputRef}
            type={input.type || 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!disabled) onConfirm(value);
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
              }
            }}
            maxLength={input.maxLength}
            placeholder={input.placeholder}
            className="vibe-chat-search-input w-full p-2.5 rounded-xl text-xs focus:outline-none"
          />
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="vibe-chat-modal-btn py-2 px-4 text-[11px] font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(input ? value : undefined)}
            disabled={disabled}
            style={{ backgroundColor: tone === 'danger' ? '#ef4444' : 'var(--vibe-accent, #ffffff)' }}
            className="vibe-chat-accent-btn py-2 px-4 text-[11px] font-bold disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

/**
 * Confirmation impérative : `await confirm({...})` renvoie true/false,
 * `await confirmInput({..., input})` renvoie la saisie ou null.
 * L'élément `confirmDialog` doit être rendu dans la page.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<
    | (ConfirmOptions & {
        input?: ConfirmDialogInput;
        resolve: (r: string | boolean | null) => void;
      })
    | null
  >(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setState({ ...opts, resolve: (r) => resolve(r === true) })),
    []
  );

  const confirmInput = useCallback(
    (opts: ConfirmOptions & { input: ConfirmDialogInput }) =>
      new Promise<string | null>((resolve) =>
        setState({ ...opts, resolve: (r) => resolve(typeof r === 'string' ? r : null) })
      ),
    []
  );

  const close = (r: string | boolean | null) => {
    const current = state;
    setState(null);
    current?.resolve(r);
  };

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(state)}
      title={state?.title || ''}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      tone={state?.tone}
      input={state?.input}
      onConfirm={(value) => close(state?.input ? value ?? null : true)}
      onCancel={() => close(null)}
    />
  );

  return { confirm, confirmInput, confirmDialog };
}
