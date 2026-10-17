/**
 * ============================================================================
 * VIBE — TUTORIEL, EXPORT & CGU (components/vibe/settings/TutorialDataSection.tsx)
 * Section Paramètres : Rejouer tutoriel / onboarding, exporter ses données en JSON, CGU.
 * ============================================================================
 */

import {
  DownloadIcon as Download,
  FileTextIcon as FileText,
  GraduationCapIcon as GraduationCap,
  RotateCcwIcon as RotateCcw,
  SparklesIcon as Sparkles,
} from "@mdevs/icons";
import type React from "react";
import {
  clearTourFlags,
  startFullTour,
} from "@/lib/vibe/services/tutorialService";
import { useNavigate } from "../router";

export interface TutorialDataSectionProps {
  isExporting: boolean;
  onExportData: () => void;
  onRestartOnboarding: () => void;
}

export const TutorialDataSection: React.FC<TutorialDataSectionProps> = ({
  onRestartOnboarding,
  isExporting,
  onExportData,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Section Aide & Tutoriel — rejoue l'intro ou la visite guidée */}
      <div
        className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4"
        data-tour="settings-tutorial"
      >
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <GraduationCap className="w-4 h-4 text-white" />
          <span>Aide &amp; Tutoriel</span>
        </div>

        <p className="text-xs text-zinc-400">
          Revoyez la visite guidée des pages (Accueil, Explorer, Profil,
          Statistiques…) ou l'intro de départ en 3 étapes (intérêts, comptes,
          premier post).
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            className="py-2.5 px-5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
            onClick={() => {
              clearTourFlags();
              void startFullTour(navigate);
            }}
            type="button"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refaire le tutoriel</span>
          </button>
          <button
            className="py-2.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all flex items-center gap-2"
            onClick={onRestartOnboarding}
            type="button"
          >
            <Sparkles className="w-4 h-4" />
            <span>Revoir l'intro (3 étapes)</span>
          </button>
        </div>
      </div>

      {/* Section Données & Compte */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Download className="w-4 h-4 text-white" />
          <span>Données personnelles &amp; Export</span>
        </div>

        <p className="text-xs text-zinc-400">
          Téléchargez une archive complète de vos publications, messages et
          paramètres au format JSON.
        </p>

        <button
          className="py-2.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all flex items-center gap-2"
          disabled={isExporting}
          onClick={onExportData}
          type="button"
        >
          <Download className="w-4 h-4" />
          <span>
            {isExporting ? "Exportation..." : "Télécharger mes données (JSON)"}
          </span>
        </button>
      </div>

      {/* Footer légal & version — sync package.json */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
        <div className="text-[11px] text-zinc-500">
          <p className="font-mono">Vibe v0.9.0</p>
          <p>© 2026 mAI Devs — Tous droits réservés</p>
        </div>
        <a
          className="py-2.5 px-5 rounded-2xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
          href="/site/legal/terms"
        >
          <FileText className="w-4 h-4" />
          Conditions d'utilisation (CGU)
        </a>
      </div>
    </>
  );
};
