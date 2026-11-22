"use client";

import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  SparklesIcon as Sparkles,
  XIcon as X,
} from "@mdevs/icons";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import Link from "@/components/site/router";
import {
  formatStorageBytes,
  getTierSpeechLimit,
  getTierTokenLimit,
  resolveTierTokenLimit,
  STORAGE_LIMITS_BYTES,
  TIER_DAILY_IMAGE_LIMITS,
} from "@/lib/site/tiers";
import { OnboardingProgress } from "./onboarding-progress";
import type { StepContext, StepDef } from "./types";

function formatTokens(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

function TierCompare({
  tier,
  prevTier,
}: {
  tier: string;
  prevTier?: string | null;
}) {
  // Accès normalisé : les tables ci-dessous ne portent pas d'alias minuscule, donc
  // une indexation directe renvoyait le quota Free pour un forfait reçu en
  // minuscules (le client renvoie « pro », pas « Pro »).
  const tok = getTierTokenLimit(tier);
  const speech = getTierSpeechLimit(tier);
  const img = TIER_DAILY_IMAGE_LIMITS[tier] ?? TIER_DAILY_IMAGE_LIMITS.Free;
  const stor = STORAGE_LIMITS_BYTES[tier] ?? STORAGE_LIMITS_BYTES.Free;

  const prevTok = resolveTierTokenLimit(prevTier);

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      {[
        {
          grad: "from-purple-500 to-blue-500",
          label: "Tokens / semaine",
          sub: prevTok ? `avant ${formatTokens(prevTok)}` : undefined,
          value: `${formatTokens(tok)}`,
        },
        {
          grad: "from-blue-500 to-indigo-500",
          label: "Audio TTS / sem.",
          value: `${formatTokens(speech)}`,
        },
        {
          grad: "from-pink-500 to-purple-500",
          label: "Images / jour",
          value: `${img}`,
        },
        {
          grad: "from-emerald-500 to-teal-500",
          label: "Storage Cloud",
          value: formatStorageBytes(stor),
        },
      ].map((c) => (
        <div
          className="rounded-2xl bg-white border border-slate-200 p-3 shadow-sm"
          key={c.label}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {c.label}
          </p>
          <p
            className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-r ${c.grad}`}
          >
            {c.value}
          </p>
          {c.sub && <p className="text-[11px] text-slate-400">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function ModelsHubVisual() {
  const items = [
    {
      col: "from-blue-500 to-purple-600",
      desc: "Opal, Apex, Omni — Cloud 1M",
      href: "/models#mai-2.5",
      name: "Série mAI-2.5",
    },
    {
      col: "from-pink-500 to-purple-600",
      desc: "mAI-2 & mAI-2-Mini — Multimodaux",
      href: "/models#mai-2",
      name: "Série mAI-2",
    },
    {
      col: "from-indigo-500 to-pink-500",
      desc: "Modèles open-weights via Ollama",
      href: "/models#mai-1.5",
      name: "Modèles Locaux",
    },
    {
      col: "from-slate-900 to-indigo-900",
      desc: "Web, CLI, Coder & Wakies",
      href: "/downloads",
      name: "Applications mAI",
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      {items.map((it) => (
        <Link
          className="group rounded-2xl border border-slate-200 bg-white p-3 hover:border-purple-300 hover:shadow-sm transition-all"
          href={it.href}
          key={it.name}
        >
          <div
            className={`inline-flex px-2 py-0.5 rounded-full bg-gradient-to-r ${it.col} text-white text-[10px] font-black uppercase tracking-wider`}
          >
            {it.name}
          </div>
          <p className="text-xs font-semibold text-slate-700 mt-1.5 group-hover:text-purple-700">
            {it.desc}
          </p>
          <p className="text-[11px] text-purple-600 font-semibold mt-1 group-hover:underline">
            Ouvrir →
          </p>
        </Link>
      ))}
    </div>
  );
}

function QuotasVisual({ tier }: { tier: string }) {
  return <TierCompare tier={tier} />;
}

function UpgradeVisual({
  tier,
  prevTier,
}: {
  tier: string;
  prevTier?: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-[1px]">
        <div className="rounded-2xl bg-white p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Forfait
          </span>
          <span className="inline-flex items-center gap-2">
            {prevTier && (
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold line-through">
                {prevTier}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-black">
              {tier}
            </span>
          </span>
        </div>
      </div>
      <TierCompare prevTier={prevTier} tier={tier} />
    </div>
  );
}

export function OnboardingCard({
  step,
  stepIndex,
  total,
  context,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onGoAccount,
  onGoModels,
}: {
  step: StepDef;
  stepIndex: number;
  total: number;
  context: StepContext;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onGoAccount: () => void;
  onGoModels: () => void;
}) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;
  const Icon = step.icon;

  let body: ReactNode = null;
  if (step.renderBody) {
    body = step.renderBody(context);
  } else {
    // default body per id
    if (step.id === "models-hub") body = <ModelsHubVisual />;
    else if (step.id === "quotas") body = <QuotasVisual tier={context.tier} />;
    else if (step.id === "unlock" || step.id === "quotas-up")
      body = <UpgradeVisual prevTier={context.prevTier} tier={context.tier} />;
    else if (step.id === "welcome" && context.username) {
      body = (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 border border-purple-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white font-black flex items-center justify-center shrink-0">
            {context.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {context.username}
            </p>
            <p className="text-xs text-slate-600 truncate">{context.email}</p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-full bg-purple-600 text-white text-[11px] font-black uppercase tracking-wider">
            {context.tier}
          </span>
        </div>
      );
    } else if (step.id === "finish" || step.id === "next") {
      body = (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            className="rounded-2xl bg-slate-900 text-white p-4 text-left hover:bg-slate-800 transition-colors"
            onClick={onGoAccount}
          >
            <p className="text-sm font-black flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Ouvrir mon compte
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Suivre quotas, stockage Cloud et appareils
            </p>
          </button>
          <button
            className="rounded-2xl bg-white border border-slate-200 p-4 text-left hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
            onClick={onGoModels}
          >
            <p className="text-sm font-black text-slate-900">
              Explorer les modèles
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Gammes Cloud mAI-2 / 2.5 et locales Ollama
            </p>
          </button>
        </div>
      );
    }
  }

  const handlePrimary = () => {
    if (step.ctaAction === "goAccount") onGoAccount();
    else if (step.ctaAction === "goModels") onGoModels();
    else if (isLast) onComplete();
    else onNext();
  };

  const primaryLabel = step.ctaLabel || (isLast ? "Terminer" : "Suivant");

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      aria-labelledby="onb-title"
      aria-modal="true"
      className="w-full max-w-[560px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden"
      exit={{ opacity: 0, scale: 0.98, y: -8 }}
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      key={step.id}
      role="dialog"
      transition={{ damping: 30, stiffness: 420, type: "spring" }}
    >
      {/* top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400" />

      <div className="p-6 sm:p-7 space-y-5">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-lg font-black tracking-tight text-slate-900 leading-tight"
                id="onb-title"
              >
                {step.title}{" "}
                {step.titleAccent && (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                    {step.titleAccent}
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">
                {step.description}
              </p>
            </div>
          </div>
          <button
            aria-label="Passer le tutoriel"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onSkip}
            title="Passer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* progress */}
        <OnboardingProgress current={stepIndex} total={total} />

        {/* body */}
        {body && <div className="pt-1">{body}</div>}

        {/* nav */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={onSkip}
          >
            Passer le tutoriel
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                onClick={onPrev}
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
            <button
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-black shadow-md hover:shadow-lg transition-all"
              onClick={handlePrimary}
            >
              {primaryLabel}
              {isLast ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
