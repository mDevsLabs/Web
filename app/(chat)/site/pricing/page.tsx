"use client";

import {
  ArrowRightIcon as ArrowRight,
  BotIcon as Bot,
  CheckCircle2Icon as CheckCircle2,
  CloudIcon as Cloud,
  GaugeIcon as Gauge,
  ImageIcon,
  PartyPopperIcon as PartyPopper,
  ShieldCheckIcon as ShieldCheck,
  SparklesIcon as Sparkles,
  UsersIcon as Users,
  Volume2Icon as Volume2,
  WrenchIcon as Wrench,
  ZapIcon as Zap,
} from "@mdevs/icons";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useWindowSize } from "react-use";
import { useAuth } from "@/components/site/auth-provider";
import { DowngradeFreeDialog } from "@/components/site/pricing/downgrade-free-dialog";
import { UpgradeCelebration } from "@/components/site/pricing/upgrade-celebration";
import { UpgradeCodeDialog } from "@/components/site/pricing/upgrade-code-dialog";
import { useSiteRouter as useRouter } from "@/components/site/router";
import { getTierRank } from "@/lib/auth/plan";
import { MaiApiError } from "@/lib/site/mai-api";

interface PlanItem {
  agentsWeb?: string;
  audioTokens: string;
  badge?: string;
  cloudStorage: string;
  dailyImages: string;
  id: "free" | "plus" | "pro" | "max";
  isPopular?: boolean;
  maiQuota: string;
  name: string;
  pluginsMCP?: string;
  priorityFeatures?: string;
  subtitle: string;
  vibe?: string;
}

const PLANS: PlanItem[] = [
  {
    audioTokens: "30 000 000 tokens / semaine",
    cloudStorage: "10 GB",
    dailyImages: "5 images / jour",
    id: "free",
    maiQuota: "Une limite élevée pour tester",
    name: "Free",
    subtitle: "Découvrez ce que l'IA peut faire",
  },
  {
    agentsWeb: "15 Agents dans mAI Web",
    audioTokens: "75 000 000 tokens / semaine",
    cloudStorage: "20 GB Cloud",
    dailyImages: "10 images / jour",
    id: "plus",
    maiQuota: "Des limites importantes pour des petits projets",
    name: "Plus",
    pluginsMCP: "Plugins & MCP",
    subtitle: "Bénéficiez d'une expérience complète",
    vibe: "Expérience améliorée dans Vibe",
  },
  {
    agentsWeb: "25 Agents dans mAI Web",
    audioTokens: "150 000 000 tokens / semaine",
    badge: "Recommandé",
    cloudStorage: "40 GB Cloud",
    dailyImages: "20 images / jour",
    id: "pro",
    isPopular: true,
    maiQuota: "Une puissance incroyable",
    name: "Pro",
    pluginsMCP: "Plugins & MCP",
    subtitle: "Maximisez votre productivité",
    vibe: "Expérience améliorée dans Vibe",
  },
  {
    agentsWeb: "Agents illimités dans mAI Web",
    audioTokens: "300 000 000 tokens / semaine",
    cloudStorage: "60 GB Cloud",
    dailyImages: "35 images / jour",
    id: "max",
    maiQuota: "Les limites les plus élevées pour un travail perfectionné",
    name: "Max",
    pluginsMCP: "Plugins & MCP",
    priorityFeatures: "Accès prioritaire aux nouvelles fonctionnalités",
    subtitle: "Puissance et limites maximales",
    vibe: "Expérience améliorée dans Vibe",
  },
];

function PricingContent() {
  const router = useRouter();
  const {
    user,
    usage,
    isAuthenticated,
    loading: authLoading,
    verifyUpgradeCode,
    switchToFreePlan,
  } = useAuth();
  const searchParams = useSearchParams();
  const { width, height } = useWindowSize();
  const selectedPlanParam = (searchParams.get("plan") || "")
    .toLowerCase()
    .trim();
  const currentTier = (user?.tier || "Free").toLowerCase().trim();
  const planRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const celebrationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // États des dialogues
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [downgradeError, setDowngradeError] = useState("");
  const [downgrading, setDowngrading] = useState(false);

  // Animation de célébration lors du passage à un forfait supérieur
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedTier, setCelebratedTier] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPlanParam && planRefs.current[selectedPlanParam]) {
      planRefs.current[selectedPlanParam]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedPlanParam]);

  useEffect(
    () => () => {
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
    },
    []
  );

  const redirectToLogin = (planId?: string) => {
    const nextTarget = planId ? `/pricing?plan=${planId}` : "/pricing";
    router.push(`/account/login?next=${encodeURIComponent(nextTarget)}`);
  };

  const handleSelectPlan = (plan: PlanItem) => {
    if (authLoading) return;
    if (!isAuthenticated) {
      redirectToLogin(plan.id);
      return;
    }

    if (plan.id === "free") {
      setDowngradeError("");
      setDowngradeDialogOpen(true);
      return;
    }

    setCodeError("");
    setTargetPlanId(plan.id);
    setUpgradeDialogOpen(true);
  };

  const handleOpenGenericUpgrade = () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }
    setCodeError("");
    setTargetPlanId(null);
    setUpgradeDialogOpen(true);
  };

  const triggerUpgradeAnimation = async (
    nextTier: string,
    previousTier: string
  ) => {
    const normalizedNext = nextTier.toLowerCase().trim();
    setCelebratedTier(normalizedNext);
    setShowCelebration(true);

    const audio = new Audio("/site/sounds/plan-update.mp3");
    audio.play().catch(() => undefined);

    if (planRefs.current[normalizedNext]) {
      planRefs.current[normalizedNext]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    toast.custom(
      () => (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/20"
          exit={{ opacity: 0, scale: 0.96, y: -20 }}
          initial={{ opacity: 0, scale: 0.94, y: -20 }}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-yellow-300 shrink-0" />
            <div>
              <p className="font-black text-base">
                Merci d&apos;avoir souscrit au forfait {nextTier} !{" "}
                <PartyPopper className="inline w-4 h-4 align-middle" />
              </p>
              <p className="text-xs text-purple-100 mt-0.5">
                Vos quotas étendus sont immédiatement disponibles !
              </p>
            </div>
          </div>
        </motion.div>
      ),
      { duration: 6000 }
    );

    try {
      const { initUpgradeForTier } = await import(
        "@/lib/site/onboarding-storage"
      );
      initUpgradeForTier(nextTier);
      window.dispatchEvent(
        new CustomEvent("mai:onboarding:open", {
          detail: { flow: "upgrade", prevTier: previousTier, tier: nextTier },
        })
      );
    } catch {}

    if (celebrationTimeout.current) {
      clearTimeout(celebrationTimeout.current);
    }
    celebrationTimeout.current = setTimeout(() => {
      setShowCelebration(false);
      setCelebratedTier(null);
    }, 5500);
  };

  const handleUpgradeSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCodeError("");

    const cleanCode = code.trim();
    if (!cleanCode) {
      setCodeError("Saisissez un code.");
      return;
    }

    const previousTier = user?.tier || usage?.tier || "Free";
    setUpgrading(true);
    try {
      const nextTier = await verifyUpgradeCode(cleanCode);
      setCode("");
      setUpgradeDialogOpen(false);
      setTargetPlanId(null);

      if (getTierRank(nextTier) > getTierRank(previousTier)) {
        await triggerUpgradeAnimation(nextTier, previousTier);
      } else {
        toast.success(`Forfait ${nextTier} activé !`);
      }
    } catch (error) {
      const message =
        error instanceof MaiApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Code invalide.";
      setCodeError(message);
      toast.error(message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleConfirmFreeDowngrade = async () => {
    setDowngradeError("");
    setDowngrading(true);
    try {
      await switchToFreePlan();
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
      setShowCelebration(false);
      setCelebratedTier(null);
      setDowngradeDialogOpen(false);
      toast.success("Vous êtes bien revenu au forfait Free.");
    } catch (error) {
      const message =
        error instanceof MaiApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Impossible de revenir au forfait Free.";
      setDowngradeError(message);
      toast.error(message);
    } finally {
      setDowngrading(false);
    }
  };

  const targetPlanName =
    PLANS.find((plan) => plan.id === targetPlanId)?.name ?? null;

  return (
    <main className="min-h-[100dvh] pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-10">
      <UpgradeCelebration
        height={height}
        show={showCelebration}
        width={width}
      />

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
          Débloquez des limites de consommation étendues pour vos assistants et
          applications mAI.
        </motion.p>
      </div>

      {/* Grid des Tarifs / Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANS.map((plan, index) => {
          const isCurrent = isAuthenticated && currentTier === plan.id;
          const isSelected = selectedPlanParam === plan.id;
          const isCelebrated = celebratedTier === plan.id;

          return (
            <motion.div
              animate={{
                opacity: 1,
                scale: isCelebrated ? [1, 1.045, 1.02] : 1,
                y: 0,
              }}
              className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 ${
                isCelebrated
                  ? "bg-gradient-to-b from-purple-50/90 to-white border-2 border-purple-600 ring-4 ring-purple-500/40 shadow-2xl z-20"
                  : isSelected && !isCurrent
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
              transition={{
                delay: isCelebrated ? 0 : 0.1 * index,
                duration: isCelebrated ? 0.65 : 0.35,
              }}
            >
              {isCelebrated && (
                <motion.div
                  animate={{ x: ["-100%", "120%"] }}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
                >
                  <div className="h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />
                </motion.div>
              )}

              {isCelebrated ? (
                <motion.span
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                >
                  <Sparkles className="w-3 h-3" />
                  Nouveau forfait actif
                </motion.span>
              ) : (
                isSelected &&
                !isCurrent && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Sélectionné
                  </span>
                )
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
                    <motion.div
                      animate={isCelebrated ? { scale: [0.95, 1.03, 1] } : {}}
                      className={`w-full py-3 rounded-2xl border font-bold text-xs text-center flex items-center justify-center gap-2 ${
                        isCelebrated
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                      transition={{ duration: 0.45 }}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Votre forfait actuel
                    </motion.div>
                  ) : (
                    <button
                      className={`w-full py-3 rounded-2xl font-extrabold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30"
                          : plan.isPopular
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                      onClick={() => handleSelectPlan(plan)}
                      type="button"
                    >
                      Passer à {plan.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
                        {plan.maiQuota}
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
            Activez votre code directement ici pour débloquer immédiatement vos
            nouveaux quotas.
          </p>
        </div>
        <button
          className="px-6 py-3.5 rounded-2xl bg-white text-purple-950 font-black text-sm hover:bg-purple-50 transition-all flex items-center gap-2 shadow-lg whitespace-nowrap cursor-pointer"
          onClick={handleOpenGenericUpgrade}
          type="button"
        >
          <Zap className="w-4 h-4 text-purple-600" />
          Activer mon code
        </button>
      </motion.div>

      <UpgradeCodeDialog
        code={code}
        error={codeError}
        onClose={() => {
          if (!upgrading) {
            setUpgradeDialogOpen(false);
            setTargetPlanId(null);
          }
        }}
        onCodeChange={setCode}
        onSubmit={handleUpgradeSubmit}
        open={upgradeDialogOpen}
        targetPlanName={targetPlanName}
        upgrading={upgrading}
      />

      <DowngradeFreeDialog
        currentTierName={user?.tier || "actuel"}
        error={downgradeError}
        onClose={() => {
          if (!downgrading) {
            setDowngradeDialogOpen(false);
          }
        }}
        onConfirm={handleConfirmFreeDowngrade}
        open={downgradeDialogOpen}
        submitting={downgrading}
      />
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
