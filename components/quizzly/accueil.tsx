"use client";

import {
  AwardIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  FlameIcon,
  GiftIcon,
  GraduationCapIcon,
  LockIcon,
  PlayIcon,
  ShieldIcon,
  SparklesIcon,
  TrophyIcon,
  ZapIcon,
} from "@mdevs/icons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { ConfettisBonneReponse } from "@/components/quizzly/confetti";
import { IconeLigue, nomLigue } from "@/components/quizzly/icones";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { IconeMatiere } from "@/components/quizzly/subject-icon";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";
import { cn, fetcher } from "@/lib/utils";

type QuizNode = {
  id: string;
  passed: boolean;
  title: string;
  unlocked: boolean;
};

type ParcoursData = {
  schoolYear: SchoolYear;
  subjects: {
    chapters: {
      id: string;
      order: number;
      title: string;
      units: {
        id: string;
        quizzes: QuizNode[];
        title: string;
      }[];
    }[];
    id: string;
    label: string;
  }[];
  year: SchoolYear;
};

export function AccueilQuizzly() {
  const resume = useResumeQuizzly();
  const data = resume.data;
  const schoolYear = data?.schoolYear;

  const { data: parcours } = useSWR<ParcoursData>(
    schoolYear ? `/api/quizzly/parcours?year=${schoolYear}` : null,
    fetcher
  );

  const [recuperationEnCours, setRecuperationEnCours] = useState(false);
  const [feteCadeau, setFeteCadeau] = useState(false);

  // Recherche du prochain quiz à faire
  let prochainQuiz: { id: string; title: string; subjectLabel: string; subjectId: string; chapterTitle: string } | null = null;
  const progressionNodes: { id: string; status: "completed" | "current" | "locked"; title: string }[] = [];

  if (parcours?.subjects) {
    for (const sub of parcours.subjects) {
      for (const ch of sub.chapters) {
        for (const un of ch.units) {
          for (const q of un.quizzes) {
            if (q.passed) {
              if (progressionNodes.length < 8) {
                progressionNodes.push({ id: q.id, status: "completed", title: q.title });
              }
            } else if (q.unlocked && !prochainQuiz) {
              prochainQuiz = {
                chapterTitle: ch.title,
                id: q.id,
                subjectId: sub.id,
                subjectLabel: sub.label,
                title: q.title,
              };
              if (progressionNodes.length < 8) {
                progressionNodes.push({ id: q.id, status: "current", title: q.title });
              }
            } else if (progressionNodes.length < 8) {
              progressionNodes.push({ id: q.id, status: "locked", title: q.title });
            }
          }
        }
      }
    }
  }

  // Remplissage par défaut de la jauge si peu de quiz
  while (progressionNodes.length < 8) {
    progressionNodes.push({
      id: `placeholder-${progressionNodes.length}`,
      status: "locked",
      title: "Exercice",
    });
  }

  // Calcul des jours de la semaine courante (Lundi à Dimanche)
  const joursSemaine = ["L", "M", "M", "J", "V", "S", "D"];
  const aujourdhuiIndex = (new Date().getDay() + 6) % 7; // 0 = Lundi, 6 = Dimanche
  const streakCount = data?.streakCount ?? 0;

  async function recupererCadeau() {
    if (data?.dailyGiftClaimed || recuperationEnCours) return;
    setRecuperationEnCours(true);
    try {
      const res = await fetch("/api/quizzly/boutique", {
        body: JSON.stringify({ itemId: "offre-jour" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Impossible de récupérer l'offre du jour.");
      }
      setFeteCadeau(true);
      toast.success("Cadeau quotidien récupéré ! +5 gemmes 💎");
      await resume.mutate();
      setTimeout(() => setFeteCadeau(false), 2500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de récupération.");
    } finally {
      setRecuperationEnCours(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <ConfettisBonneReponse actif={feteCadeau} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Colonne Principale (Gauche - 8/12) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Hero Banner avec Quizzy */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-white via-blue-50/40 to-blue-100/30 p-6 shadow-sm shadow-blue-500/5 sm:p-8 dark:border-blue-900/40 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900">
            {/* Effet halo lumineux doux */}
            <div className="pointer-events-none absolute -top-16 -left-16 size-64 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              {/* Mascotte Quizzy avec animation douce */}
              <div className="relative shrink-0">
                <div className="q-float relative size-36 sm:size-44">
                  <Image
                    alt="Quizzy, la mascotte de Quizzly"
                    className="object-contain drop-shadow-lg"
                    fill
                    priority
                    sizes="(max-width: 640px) 144px, 176px"
                    src="/quizzly/quizzy.png"
                  />
                </div>
                {/* Ombre portée douce sous Quizzy */}
                <div className="mx-auto h-3 w-28 rounded-full bg-blue-500/15 blur-sm dark:bg-blue-400/10" />
              </div>

              {/* Texte et appel à l'action */}
              <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  <SparklesIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{schoolYear ? libelleAnnee(schoolYear as SchoolYear) : "Prêt à réviser ?"}</span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  Bonjour ! <span className="inline-block animate-wiggle">👋</span>
                </h1>

                <p className="max-w-md text-base font-medium text-slate-600 dark:text-slate-300">
                  Prêt à progresser aujourd'hui et à consolider vos connaissances ?
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                    href={prochainQuiz ? `/quizzly/quiz/${prochainQuiz.id}` : "/quizzly/apprentissage"}
                  >
                    <span>Commencer une leçon</span>
                    <ChevronRightIcon className="size-4 stroke-[2.5]" />
                  </Link>

                  <Link
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
                    href="/quizzly/apprentissage"
                  >
                    <span>Explorer le parcours</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Barre de progression / Fil d'étapes */}
            <div className="mt-8 border-t border-blue-100/80 pt-6 dark:border-blue-900/30">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Votre progression récente
                </span>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  href="/quizzly/apprentissage"
                >
                  <span>Voir tout</span>
                  <ChevronRightIcon className="size-3" />
                </Link>
              </div>

              {/* Ligne des nœuds */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
                {progressionNodes.map((node, idx) => (
                  <div className="flex flex-1 items-center" key={node.id}>
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm",
                          node.status === "completed" &&
                            "border-2 border-blue-600 bg-blue-600 text-white shadow-blue-500/20",
                          node.status === "current" &&
                            "border-2 border-blue-500 bg-blue-100 text-blue-700 ring-4 ring-blue-500/20 q-float dark:bg-blue-950 dark:text-blue-300",
                          node.status === "locked" &&
                            "border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500"
                        )}
                        title={node.title}
                      >
                        {node.status === "completed" ? (
                          <CheckIcon className="size-4 stroke-[3]" />
                        ) : node.status === "current" ? (
                          <BookOpenIcon className="size-4" />
                        ) : (
                          <LockIcon className="size-3.5" />
                        )}
                      </div>
                    </div>
                    {idx < progressionNodes.length - 1 && (
                      <div
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          node.status === "completed"
                            ? "bg-blue-600"
                            : "bg-slate-200 dark:bg-slate-800"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3 Statistiques clés */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Stat 1: Total XP */}
            <div className="surface-quizzly-card flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
                <ZapIcon className="size-6 fill-amber-500/20" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total XP</p>
                <p className="truncate text-2xl font-black text-slate-900 dark:text-white">
                  {data?.xp ?? 0}
                </p>
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  +{data?.weeklyXp ?? 0} cette semaine
                </p>
              </div>
            </div>

            {/* Stat 2: Niveau & Palier */}
            <div className="surface-quizzly-card flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <GraduationCapIcon className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Niveau</p>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Niv. {data?.niveau ?? 1}
                  </span>
                </div>
                <p className="truncate text-2xl font-black text-slate-900 dark:text-white">
                  {data?.xpDansPalier ?? 0} <span className="text-xs font-semibold text-slate-400">/ {data?.xpPalier ?? 100}</span>
                </p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(100, Math.max(5, ((data?.xpDansPalier ?? 0) / (data?.xpPalier || 100)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stat 3: Série & Record */}
            <div className="surface-quizzly-card flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/20">
                <FlameIcon className="size-6 fill-orange-500/20" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Série active</p>
                <p className="truncate text-2xl font-black text-slate-900 dark:text-white">
                  {data?.streakCount ?? 0} <span className="text-xs font-semibold text-slate-500">jours</span>
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Record : {data?.streakBest ?? 0} jours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Latérale / Widgets Droite (4/12) */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Widget 1: Semaine de Série en cours */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-500/5 dark:border-blue-900/40 dark:bg-slate-900">
            {/* Flamme décorative transparente d'arrière-plan */}
            <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-5 dark:opacity-10">
              <FlameIcon className="size-36 text-orange-500 fill-orange-500" />
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <FlameIcon className="size-4.5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Série en cours
                  </h2>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  href="/quizzly/quetes"
                >
                  <span>Détails</span>
                  <ChevronRightIcon className="size-3" />
                </Link>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-orange-500">
                  {streakCount}
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {streakCount > 1 ? "jours d'affilée" : "jour d'affilée"}
                </span>
              </div>

              {/* Jauge des 7 jours de la semaine */}
              <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                {joursSemaine.map((jour, index) => {
                  const estPasse = index < aujourdhuiIndex;
                  const estAujourdhui = index === aujourdhuiIndex;
                  const valide = streakCount > 0 && (estPasse || (estAujourdhui && streakCount > 0));

                  return (
                    <div className="flex flex-col items-center gap-1.5" key={jour}>
                      <span className="text-[10px] font-bold text-slate-400">{jour}</span>
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full text-xs transition-all",
                          valide && "bg-orange-500 text-white font-bold shadow-xs",
                          !valide && estAujourdhui && "border-2 border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-950/40",
                          !valide && !estAujourdhui && "bg-slate-200/80 text-slate-400 dark:bg-slate-700/60"
                        )}
                      >
                        {valide ? (
                          <CheckIcon className="size-3.5 stroke-[3]" />
                        ) : estAujourdhui ? (
                          <span className="size-1.5 rounded-full bg-orange-500" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {data?.streakFreezes ? (
                <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  🛡️ {data.streakFreezes} gel{data.streakFreezes > 1 ? "s" : ""} de série actif{data.streakFreezes > 1 ? "s" : ""}
                </p>
              ) : null}
            </div>
          </div>

          {/* Widget 2: Récompense quotidienne */}
          <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50/70 to-white p-5 shadow-sm shadow-blue-500/5 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <GiftIcon className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Récompense quotidienne
                </h2>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {data?.dailyGiftClaimed
                    ? "Déjà récupérée aujourd'hui !"
                    : "Votre cadeau du jour est disponible"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <span>+5 Gemmes</span>
                <span className="text-sm">💎</span>
              </span>

              <button
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-all",
                  data?.dailyGiftClaimed
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    : "cursor-pointer bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-95"
                )}
                disabled={Boolean(data?.dailyGiftClaimed || recuperationEnCours)}
                onClick={recupererCadeau}
                type="button"
              >
                {recuperationEnCours
                  ? "Récupération…"
                  : data?.dailyGiftClaimed
                    ? "Récupéré ✓"
                    : "Récupérer"}
              </button>
            </div>
          </div>

          {/* Widget 3: Ligue actuelle et Prochain Quiz */}
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-500/5 dark:border-blue-900/40 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <TrophyIcon className="size-4.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ligue actuelle
                </h2>
              </div>
              <Link
                className="text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                href="/quizzly/ligues"
              >
                Classement &gt;
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
              <div className="relative shrink-0">
                {data?.league ? (
                  <IconeLigue className="size-12 drop-shadow-md" league={data.league as any} />
                ) : (
                  <ShieldIcon className="size-12 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  Ligue {data?.league ? nomLigue(data.league as any) : "Bronze"}
                </p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {data?.weeklyXp ?? 0} XP cette semaine
                </p>
              </div>
            </div>

            {/* Prochain Quiz Card */}
            {prochainQuiz ? (
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Prochain quiz recommandé
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <IconeMatiere className="size-3.5" id={prochainQuiz.subjectId} />
                      <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                        {prochainQuiz.subjectLabel}
                      </span>
                    </div>
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {prochainQuiz.title}
                    </p>
                  </div>

                  <Link
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 active:scale-95"
                    href={`/quizzly/quiz/${prochainQuiz.id}`}
                  >
                    <span>Lancer</span>
                    <PlayIcon className="size-3 fill-current" />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
