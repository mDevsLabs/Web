"use client";

import {
  AlertTriangleIcon as AlertTriangle,
  ArrowRightIcon as ArrowRight,
  Loader2Icon as Loader2,
} from "@mdevs/icons";
import { SiteModalShell } from "./site-modal-shell";

interface DowngradeFreeDialogProps {
  currentTierName: string;
  error: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  open: boolean;
  submitting: boolean;
}

export function DowngradeFreeDialog({
  open,
  currentTierName,
  error,
  submitting,
  onClose,
  onConfirm,
}: DowngradeFreeDialogProps) {
  return (
    <SiteModalShell
      accentClassName="from-slate-600 via-slate-700 to-slate-900"
      disabled={submitting}
      labelId="downgrade-free-dialog-title"
      onClose={onClose}
      open={open}
    >
      <div className="p-6 md:p-7 space-y-5">
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2
              className="text-lg font-black text-slate-900 tracking-tight"
              id="downgrade-free-dialog-title"
            >
              Revenir au forfait Free ?
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Aucun code n&apos;est requis. Confirmez simplement le passage de{" "}
              <span className="font-bold text-slate-900">
                {currentTierName}
              </span>{" "}
              vers <span className="font-bold text-slate-900">Free</span>.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <p className="font-bold text-slate-800">
            Ce qui change immédiatement :
          </p>
          <p>
            • Vos quotas hebdomadaires et de stockage repassent aux limites du
            forfait Free.
          </p>
          <p>
            • Les fonctionnalités réservées aux forfaits payants (mode Agent,
            Wakies) sont désactivées.
          </p>
          <p>
            • Vos données existantes restent conservées et vous pourrez
            réactiver un code à tout moment.
          </p>
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
          <button
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            disabled={submitting}
            onClick={onConfirm}
            type="button"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {submitting ? "Passage à Free…" : "Confirmer le retour à Free"}
          </button>
        </div>
      </div>
    </SiteModalShell>
  );
}
