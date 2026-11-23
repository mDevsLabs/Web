"use client";

import {
  KeyRoundIcon as KeyRound,
  Loader2Icon as Loader2,
  SparklesIcon as Sparkles,
} from "@mdevs/icons";
import { type FormEvent, useEffect, useRef } from "react";
import { SiteModalShell } from "./site-modal-shell";

interface UpgradeCodeDialogProps {
  code: string;
  error: string;
  onClose: () => void;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void | Promise<void>;
  open: boolean;
  targetPlanName?: string | null;
  upgrading: boolean;
}

export function UpgradeCodeDialog({
  open,
  targetPlanName,
  code,
  error,
  upgrading,
  onCodeChange,
  onClose,
  onSubmit,
}: UpgradeCodeDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <SiteModalShell
      accentClassName="from-purple-600 via-indigo-600 to-blue-600"
      disabled={upgrading}
      labelId="upgrade-code-dialog-title"
      onClose={onClose}
      open={open}
    >
      <div className="p-6 md:p-7 space-y-5">
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-lg font-black text-slate-900 tracking-tight"
                id="upgrade-code-dialog-title"
              >
                Activer un Code d&apos;Upgrade
              </h2>
              {targetPlanName && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-extrabold uppercase tracking-wider">
                  {targetPlanName}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Saisissez un code d&apos;accès Plus, Pro ou Max pour augmenter
              immédiatement votre forfait mAI.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              htmlFor="pricing-upgrade-code-input"
            >
              Code d&apos;accès
            </label>
            <input
              autoComplete="off"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-slate-900 placeholder-slate-400 uppercase tracking-wider font-mono"
              disabled={upgrading}
              id="pricing-upgrade-code-input"
              onChange={(event) =>
                onCodeChange(event.target.value.toUpperCase())
              }
              placeholder="CODE-XXXX"
              ref={inputRef}
              type="text"
              value={code}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
            <button
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              disabled={upgrading}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              disabled={upgrading}
              type="submit"
            >
              {upgrading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {upgrading ? "Activation…" : "Activer"}
            </button>
          </div>
        </form>
      </div>
    </SiteModalShell>
  );
}
