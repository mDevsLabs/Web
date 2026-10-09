/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — EXPLAIN MODAL (src/components/feed/ExplainModal.tsx)
 * Transparent algorithm breakdown ("Pourquoi je vois cette publication ?")
 * ============================================================================
 */

import { ActivityIcon as Activity, EyeIcon as Eye, ShieldCheckIcon as ShieldCheck, SparklesIcon as Sparkles, XIcon as X, ZapIcon as Zap } from "@mdevs/icons";
import type React from "react";
import type { Post } from "@/lib/vibe/types/vibe";

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !post) return null;

  const breakdown = post.scoreBreakdown || {
    dwellScore: 0,
    engagementScore: 74,
    freshnessScore: 88,
    graphProximityScore: 50,
    safetyFactor: 1.0,
    semanticScore: 82,
    timeContextBoost: 0,
    velocityScore: 65,
  };

  const signals = [
    {
      icon: Zap,
      label: "Fraîcheur temporelle",
      value: `${breakdown.freshnessScore}%`,
    },
    {
      icon: Activity,
      label: "Engagement & Vélocité",
      value: `${breakdown.velocityScore}%`,
    },
    {
      icon: Sparkles,
      label: "Affinité Sémantique mAI",
      value: `${breakdown.semanticScore}%`,
    },
    {
      icon: ShieldCheck,
      label: "Indice de Confiance & Sécurité",
      value: `${Math.round(breakdown.safetyFactor * 100)}%`,
    },
    {
      icon: Eye,
      label: "Temps passé (profil temporel)",
      value: `${(breakdown as any).dwellScore ?? 0}%`,
    },
    {
      icon: Zap,
      label: "Contexte temporel",
      value: `+${(breakdown as any).timeContextBoost ?? 0}%`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Eye className="w-5 h-5 text-white" />
            <span>Transparence Algorithmique Vibe</span>
          </div>
          <button
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono uppercase text-zinc-500">
            Explication mAI
          </div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-200">
            {post.explanation ||
              "Recommandé selon votre historique d'engagement et la vélocité globale de la publication."}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Score Global de Recommandation
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {post.recommendationScore || 85} / 100
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${post.recommendationScore || 85}%` }}
            />
          </div>
        </div>

        {/* Signals Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {signals.map((sig) => {
            const Icon = sig.icon;
            return (
              <div
                className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1"
                key={sig.label}
              >
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                  <Icon className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{sig.label}</span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {sig.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            className="py-2.5 px-6 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
            onClick={onClose}
          >
            Fermer l'inspecteur
          </button>
        </div>
      </div>
    </div>
  );
};
