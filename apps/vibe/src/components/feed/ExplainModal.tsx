/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — EXPLAIN MODAL (src/components/feed/ExplainModal.tsx)
 * Transparent algorithm breakdown ("Pourquoi je vois cette publication ?")
 * ============================================================================
 */

import React from 'react';
import { X, Sparkles, ShieldCheck, Zap, Activity, Eye } from 'lucide-react';
import { Post } from '../../types/vibe';

interface ExplainModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !post) return null;

  const breakdown = post.scoreBreakdown || {
    freshnessScore: 88,
    engagementScore: 74,
    velocityScore: 65,
    semanticScore: 82,
    graphProximityScore: 50,
    safetyFactor: 1.0,
    dwellScore: 0,
    timeContextBoost: 0,
  };

  const signals = [
    { label: 'Fraîcheur temporelle', value: `${breakdown.freshnessScore}%`, icon: Zap },
    { label: 'Engagement & Vélocité', value: `${breakdown.velocityScore}%`, icon: Activity },
    { label: 'Affinité Sémantique mAI', value: `${breakdown.semanticScore}%`, icon: Sparkles },
    { label: 'Indice de Confiance & Sécurité', value: `${Math.round(breakdown.safetyFactor * 100)}%`, icon: ShieldCheck },
    { label: 'Temps passé (profil temporel)', value: `${(breakdown as any).dwellScore ?? 0}%`, icon: Eye },
    { label: 'Contexte temporel', value: `+${(breakdown as any).timeContextBoost ?? 0}%`, icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Eye className="w-5 h-5 text-white" />
            <span>Transparence Algorithmique Vibe</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono uppercase text-zinc-500">Explication mAI</div>
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-200">
            {post.explanation || "Recommandé selon votre historique d'engagement et la vélocité globale de la publication."}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Score Global de Recommandation</span>
            <span className="text-sm font-bold text-white font-mono">{post.recommendationScore || 85} / 100</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: `${post.recommendationScore || 85}%` }} />
          </div>
        </div>

        {/* Signals Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {signals.map((sig) => {
            const Icon = sig.icon;
            return (
              <div key={sig.label} className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                  <Icon className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{sig.label}</span>
                </div>
                <div className="text-base font-bold text-white font-mono">{sig.value}</div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
          >
            Fermer l'inspecteur
          </button>
        </div>
      </div>
    </div>
  );
};
