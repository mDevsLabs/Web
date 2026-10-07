"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  Gauge,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Users,
  Volume2,
  Wrench,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useAuth } from "@/components/site/auth-provider";
import Link from "@/components/site/router";

interface PlanItem {
  agentsWeb?: string;
  apiRequests: string;
  audioTokens: string;
  badge?: string;
  cloudStorage: string;
  dailyImages: string;
  id: string;
  isPopular?: boolean;
  maiTokens: string;
  name: string;
  pluginsMCP?: string;
  priorityFeatures?: string;
  subtitle: string;
  vibe?: string;
}

const PLANS: PlanItem[] = [
  {
    apiRequests: "500 requêtes / semaine",
    audioTokens: "30 000 000 tokens / semaine",
    cloudStorage: "10 GB",
    dailyImages: "5 images / jour",
    id: "free",
    maiTokens: "10 000 000 tokens / semaine",
    name: "Free",
    subtitle: "Découvrez ce que l'IA peut faire",
  },
  {
    agentsWeb: "15 Agents dans mAI Web",
    apiRequests: "1 500 requêtes / semaine",
    audioTokens: "75 000 000 tokens / semaine",
    cloudStorage: "20 GB Cloud",
    dailyImages: "10 images / jour",
    id: "plus",
    maiTokens: "20 000 000 tokens / semaine",
    name: "Plus",
    pluginsMCP: "Plugins & MCP",
    subtitle: "Bénéficiez d'une expérience complète",
    vibe: "Expérience améliorée dans Vibe",
  },
  {
    agentsWeb: "25 Agents dans mAI Web",
    apiRequests: "3 000 requêtes / semaine",
    audioTokens: "150 000 000 tokens / semaine",
    badge: "Recommandé",
    cloudStorage: "40 GB Cloud",
    dailyImages: "20 images / jour",
    id: "pro",
    isPopular: true,
    maiTokens: "30 000 000 tokens / semaine",
    name: "Pro",
    pluginsMCP: "Plugins & MCP",
    subtitle: "Maximisez votre productivité",
    vibe: "Expérience améliorée dans Vibe",
  },
  {
    agentsWeb: "Agents illimités dans mAI Web",
    apiRequests: "7 500 requêtes / semaine",
    audioTokens: "300 000 000 tokens / semaine",
    cloudStorage: "60 GB Cloud",
    dailyImages: "35 images / jour",
    id: "max",
    maiTokens: "50 000 000 tokens / semaine",
    name: "Max",
    pluginsMCP: "Plugins & MCP",
    priorityFeatures: "Accès prioritaire aux nouvelles fonctionnalités",
    subtitle: "Puissance et limites maximales",
    vibe: "Expérience améliorée dans Vibe",
  },
];

function PricingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const selectedPlanParam = (searchParams.get("plan") || "")
    .toLowerCase()
    .trim();
  const currentTier = (user?.tier || "Free").toLowerCase().trim();
  const planRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedPlanParam && planRefs.current[selectedPlanParam]) {
      planRefs.current[selectedPlanParam]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedPlanParam]);

  return (
    <main className="min-h-[100dvh] pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 text-xs font-bold uppercase tracking-wider"
          initial={{ opacity: 0, y: -10 }}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          Offres &amp; Abonnements
        </motion.div>

        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          transition={{ delay: 0.1 }}
        >
          Choisissez le forfait adapté à vos besoins
        </motion.h1>

        <motion.p
          animate={{ opacity: 1 }}
          className="text-slate-600 text-base"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.2 }}
        >
          Débloquez des limites de consommation étendues pour vos assistants mAI
          et vos clés d&apos;API.
        </motion.p>
      </div>

      {/* Grid des Tarifs / Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANS.map((plan, index) => {
          const isCurrent = currentTier === plan.id;
          const isSelected = selectedPlanParam === plan.id;

          return (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 ${
                isSelected && !isCurrent
                  ? "bg-gradient-to-b from-purple-50/90 to-white border-2 border-purple-600 ring-4 ring-purple-500/30 shadow-2xl scale-[1.03] z-10"
                  : plan.isPopular
                    ? "bg-gradient-to-b from-blue-50/80 to-white border-2 border-blue-500 shadow-xl scale-[1.02]"
                    : "bg-white/60 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md"
              }`}
              initial={{ opacity: 0, y: 20 }}
              key={plan.id}
              ref={(el) => {
                planRefs.current[plan.id] = el;
              }}
              transition={{ delay: 0.1 * index }}
            >
              {isSelected && !isCurrent && (
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Sélectionné
                </span>
              )}

              {plan.badge && (
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                    {plan.subtitle}
                  </p>
                </div>

                {/* Bouton d'action */}
                <div>
                  {isCurrent ? (
                    <div className="w-full py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 font-bold text-xs text-center flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Votre forfait actuel
                    </div>
                  ) : (
                    <Link
                      className={`w-full py-3 rounded-2xl font-extrabold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isSelected
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30"
                          : plan.isPopular
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                      href={`/account?plan=${plan.id}#upgrade-code`}
                    >
                      Passer à {plan.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Quotas disponibles */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-lg bg-purple-100 text-purple-600 mt-0.5">
                      <Gauge className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Quota mAI
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {plan.maiTokens}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-lg bg-blue-100 text-blue-600 mt-0.5">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Quota API
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {plan.apiRequests}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-lg bg-cyan-100 text-cyan-600 mt-0.5">
                      <Cloud className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Stockage Cloud
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {plan.cloudStorage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-lg bg-pink-100 text-pink-600 mt-0.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Quota Images
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {plan.dailyImages}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-lg bg-indigo-100 text-indigo-600 mt-0.5">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Quota Audio (TTS)
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {plan.audioTokens}
                      </p>
                    </div>
                  </div>

                  {plan.pluginsMCP && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-amber-100 text-amber-600 mt-0.5">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Plugins &amp; MCP
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {plan.pluginsMCP}
                        </p>
                      </div>
                    </div>
                  )}

                  {plan.agentsWeb && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-rose-100 text-rose-600 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Agents
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {plan.agentsWeb}
                        </p>
                      </div>
                    </div>
                  )}

                  {plan.vibe && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-violet-100 text-violet-600 mt-0.5">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Vibe</p>
                        <p className="text-xs text-slate-600 font-medium">
                          {plan.vibe}
                        </p>
                      </div>
                    </div>
                  )}

                  {plan.priorityFeatures && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-orange-100 text-orange-600 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Nouveautés prioritaires
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {plan.priorityFeatures}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Activation via Code */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-950 p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.5 }}
      >
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight">
            Vous possédez un code de forfait ?
          </h2>
          <p className="text-purple-200 text-sm max-w-xl">
            Rendez-vous dans la section d&apos;activation de votre compte pour
            débloquer immédiatement vos nouveaux quotas.
          </p>
        </div>
        <Link
          className="px-6 py-3.5 rounded-2xl bg-white text-purple-950 font-black text-sm hover:bg-purple-50 transition-all flex items-center gap-2 shadow-lg whitespace-nowrap"
          href="/account#upgrade-code"
        >
          <Zap className="w-4 h-4 text-purple-600" />
          Activer mon code
        </Link>
      </motion.div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
