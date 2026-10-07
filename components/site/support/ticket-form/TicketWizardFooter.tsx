"use client";

import { ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import type { TicketStep } from "@/components/site/support/ticket-form/ticket-form-types";
import { WIZARD_STEPS } from "@/components/site/support/ticket-form/ticket-form-types";

export function TicketWizardFooter({
  step,
  submitting,
  uploading,
  onBack,
  onNext,
}: {
  step: TicketStep;
  submitting: boolean;
  uploading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row">
        <button
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          disabled={step === 0 || submitting}
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Retour
        </button>
        {step < WIZARD_STEPS.length - 1 ? (
          <button
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={uploading}
            onClick={onNext}
            type="button"
          >
            Continuer <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={submitting || uploading}
            type="submit"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />{" "}
                Enregistrement…
              </>
            ) : (
              <>
                <Send aria-hidden="true" className="h-4 w-4" /> Envoyer au
                support mAI
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-center text-[11px] text-slate-400">
        Les tickets inactifs sont supprimés après 365 jours (purge Z1 incluse).
      </p>
    </>
  );
}
