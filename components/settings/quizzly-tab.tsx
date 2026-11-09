"use client";

import {
  BellIcon,
  CheckIcon,
  FlameIcon,
  GraduationCapIcon,
  HeartIcon,
  SparklesIcon,
  TrophyIcon,
  Volume2Icon,
  VolumeXIcon,
  ZapIcon,
} from "@mdevs/icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { IconeClasse } from "@/components/quizzly/icones";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { IconeMatiere } from "@/components/quizzly/subject-icon";
import {
  libelleAnnee,
  PROGRAM,
  SCHOOL_YEARS,
  type SchoolYear,
} from "@/lib/quizzly/program";
import {
  isSoundEnabled,
  playClickSound,
  playCorrectSound,
  playFanfareSound,
  setSoundEnabled,
} from "@/lib/quizzly/sound-effects";
import { cn } from "@/lib/utils";

const COACH_TONES = [
  {
    description: "Encourageant, chaleureux et félicite chaque progrès.",
    id: "bienveillant",
    label: "Bienveillant & Motivant",
  },
  {
    description: "Va droit au but, explique les règles avec rigueur.",
    id: "analytique",
    label: "Analytique & Structuré",
  },
  {
    description: "Pose des questions guidées pour faire trouver la solution.",
    id: "socratique",
    label: "Interactif & Guidé",
  },
] as const;

const DAILY_TARGETS = [
  { id: 1, label: "1 quiz / jour", subtitle: "Régulier (5 min)" },
  { id: 3, label: "3 quiz / jour", subtitle: "Recommandé (15 min)" },
  { id: 5, label: "5 quiz / jour", subtitle: "Intensif (25 min)" },
] as const;

export function QuizzlyTab() {
  const { data, error, isLoading, mutate } = useResumeQuizzly();
  const [enCours, setEnCours] = useState(false);
  const [sonActif, setSonActif] = useState(true);
  const [animationsActives, setAnimationsActives] = useState(true);
  const [tonCoach, setTonCoach] = useState<string>("bienveillant");
  const [objectifQuiz, setObjectifQuiz] = useState<number>(3);
  const [rappelsActifs, setRappelsActifs] = useState(true);

  useEffect(() => {
    setSonActif(isSoundEnabled());
    try {
      const anim = localStorage.getItem("quizzly_animations");
      if (anim !== null) {
        setAnimationsActives(anim === "true");
      }
      const tone = localStorage.getItem("quizzly_coach_tone");
      if (tone) {
        setTonCoach(tone);
      }
      const target = localStorage.getItem("quizzly_daily_target");
      if (target) {
        setObjectifQuiz(Number(target));
      }
      const rem = localStorage.getItem("quizzly_reminders");
      if (rem !== null) {
        setRappelsActifs(rem === "true");
      }
    } catch {
      // Ignorer si localStorage indisponible
    }
  }, []);

  async function enregistrerProfil(corps: {
    modelId?: string | null;
    schoolYear?: SchoolYear;
    subjects?: string[];
  }) {
    setEnCours(true);
    try {
      const reponse = await fetch("/api/quizzly/profil", {
        body: JSON.stringify(corps),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const recu = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(recu?.message || "Enregistrement refusé.");
      }
      playClickSound();
      toast.success("Paramètre Quizzly enregistré.");
      await mutate();
    } catch (raison) {
      toast.error(
        raison instanceof Error ? raison.message : "Enregistrement refusé."
      );
    } finally {
      setEnCours(false);
    }
  }

  function toggleSon() {
    const suivant = !sonActif;
    setSonActif(suivant);
    setSoundEnabled(suivant);
    if (suivant) {
      playCorrectSound();
      toast.success("Effets sonores activés.");
    } else {
      toast.info("Effets sonores désactivés.");
    }
  }

  function toggleAnimations() {
    const suivant = !animationsActives;
    setAnimationsActives(suivant);
    try {
      localStorage.setItem("quizzly_animations", String(suivant));
    } catch {}
    toast.success(
      suivant ? "Animations et confettis activés." : "Animations réduites."
    );
  }

  function changerTon(id: string) {
    setTonCoach(id);
    try {
      localStorage.setItem("quizzly_coach_tone", id);
    } catch {}
    playClickSound();
    toast.success("Style pédagogique du Coach mis à jour.");
  }

  function changerObjectif(target: number) {
    setObjectifQuiz(target);
    try {
      localStorage.setItem("quizzly_daily_target", String(target));
    } catch {}
    playClickSound();
    toast.success(`Objectif quotidien fixé à ${target} quiz.`);
  }

  function toggleRappels() {
    const suivant = !rappelsActifs;
    setRappelsActifs(suivant);
    try {
      localStorage.setItem("quizzly_reminders", String(suivant));
    } catch {}
    toast.success(
      suivant
        ? "Rappels de série quotidienne activés."
        : "Rappels désactivés."
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <SparklesIcon className="size-8 text-q-level animate-spin" />
        <p className="text-sm">Chargement des réglages Quizzly…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        Impossible de charger les réglages Quizzly.
      </div>
    );
  }

  const annee = (
    SCHOOL_YEARS.includes(data.schoolYear as SchoolYear)
      ? data.schoolYear
      : "6e"
  ) as SchoolYear;
  const matieres = PROGRAM[annee] || [];
  const suivies = new Set(data.subjects);

  function basculerMatiere(id: string) {
    const toutes = matieres.map((m) => m.id);
    const actuel = data && data.subjects.length > 0 ? data.subjects : toutes;
    const suivant = actuel.includes(id)
      ? actuel.filter((entree) => entree !== id)
      : [...actuel, id];
    if (suivant.length === 0) {
      toast.warning("Conservez au moins une matière dans votre sélection.");
      return;
    }
    enregistrerProfil({
      subjects: suivant.length === toutes.length ? [] : suivant,
    });
  }

  function selectionnerTout() {
    enregistrerProfil({ subjects: [] });
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl py-6">
      {/* En-tête de section */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-q-level/10 text-q-level ring-1 ring-q-border/30">
            <GraduationCapIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Quizzly — Paramètres & Préférences
            </h2>
            <p className="text-xs text-muted-foreground">
              Personnalisez votre classe, vos matières scolaires, le Coach mAI et votre expérience de jeu.
            </p>
          </div>
        </div>
      </div>

      {/* 1. CLASSE & NIVEAU SCOLAIRE */}
      <section className="flex flex-col gap-4 scroll-mt-24" id="quizzly-classe">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              1. Classe & Niveau scolaire
            </h3>
            <p className="text-xs text-muted-foreground">
              Le programme, les quiz et les synthèses s'adaptent automatiquement à votre classe.
            </p>
          </div>
          <span className="rounded-full bg-q-level/15 px-2.5 py-0.5 text-xs font-bold text-q-level">
            Classe actuelle : {libelleAnnee(annee)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {SCHOOL_YEARS.map((year) => {
            const actif = year === annee;
            const estLycee = ["2nde", "1ere", "terminale"].includes(year);
            return (
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-all cursor-pointer",
                  actif
                    ? "border-q-level bg-q-level/10 ring-2 ring-q-level/30 shadow-xs"
                    : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
                )}
                disabled={enCours}
                key={year}
                onClick={() => enregistrerProfil({ schoolYear: year })}
                type="button"
              >
                <IconeClasse
                  className="size-8 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-q-border/40"
                  year={year}
                />
                <div className="text-center">
                  <span className="text-xs font-bold text-foreground block">
                    {libelleAnnee(year)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {estLycee ? "Lycée" : "Collège"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. MATIÈRES SUIVIES */}
      <section className="flex flex-col gap-4 scroll-mt-24" id="quizzly-matieres">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              2. Matières suivies
            </h3>
            <p className="text-xs text-muted-foreground">
              Sélectionnez les matières que vous souhaitez travailler. Sans sélection, toutes les matières de la classe sont affichées.
            </p>
          </div>
          <button
            className="text-xs font-semibold text-q-level hover:underline cursor-pointer"
            disabled={enCours}
            onClick={selectionnerTout}
            type="button"
          >
            Toutes les matières
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {matieres.map((matiere) => {
            const active = suivies.size === 0 || suivies.has(matiere.id);
            return (
              <button
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all cursor-pointer",
                  active
                    ? "border-q-level/60 bg-q-level/10 text-foreground ring-1 ring-q-level/30"
                    : "border-border/50 bg-card/60 text-muted-foreground opacity-60 hover:opacity-100"
                )}
                disabled={enCours}
                key={matiere.id}
                onClick={() => basculerMatiere(matiere.id)}
                type="button"
              >
                <div className="flex size-7 items-center justify-center rounded-xl bg-card text-q-level shrink-0 shadow-xs">
                  <IconeMatiere id={matiere.id} />
                </div>
                <span className="truncate text-xs font-bold">
                  {matiere.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. COACH MAI & PÉDAGOGIE */}
      <section className="flex flex-col gap-4 scroll-mt-24" id="quizzly-coach">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            3. Coach mAI & Pédagogie
          </h3>
          <p className="text-xs text-muted-foreground">
            Configurez le modèle d'intelligence artificielle et l'approche pédagogique de votre tuteur.
          </p>
        </div>

        <div className="surface-card flex flex-col gap-4 p-5 rounded-3xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foreground">
              Modèle d'IA dédié au Coach
            </label>
            <p className="text-[11px] text-muted-foreground">
              Ce modèle répondra à vos questions sur les cours et analysera vos erreurs de quiz.
            </p>
            <div className="mt-1">
              <ModelSelectorCompact
                allowEmpty
                disabled={enCours}
                emptyLabel="Modèle du compte par défaut"
                fallbackToFirst={false}
                onModelChange={(modelId) => {
                  enregistrerProfil({
                    modelId: modelId.trim() ? modelId.trim() : null,
                  });
                }}
                selectedModelId={data.modelId ?? ""}
                variant="block"
              />
            </div>
          </div>

          <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground">
              Style pédagogique du tuteur
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {COACH_TONES.map((tone) => {
                const actif = tonCoach === tone.id;
                return (
                  <button
                    className={cn(
                      "flex flex-col gap-1 rounded-2xl border p-3.5 text-left transition-all cursor-pointer",
                      actif
                        ? "border-q-level bg-q-level/10 ring-1 ring-q-level/30 shadow-xs"
                        : "border-border/60 bg-card hover:bg-muted/40"
                    )}
                    key={tone.id}
                    onClick={() => changerTon(tone.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {tone.label}
                      </span>
                      {actif && <CheckIcon className="size-3.5 text-q-level" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {tone.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXPÉRIENCE D'APPRENTISSAGE & SONS */}
      <section className="flex flex-col gap-4 scroll-mt-24" id="quizzly-audio">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            4. Expérience d'apprentissage & Effets sonores
          </h3>
          <p className="text-xs text-muted-foreground">
            Ajustez l'ambiance sonore, les célébrations visuelles et votre rythme quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Sons Web Audio */}
          <div className="surface-card flex items-center justify-between p-4 rounded-3xl">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-q-level/10 text-q-level">
                {sonActif ? (
                  <Volume2Icon className="size-4" />
                ) : (
                  <VolumeXIcon className="size-4" />
                )}
              </span>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Effets sonores interactifs
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Retours audio à chaque réponse et victoire.
                </span>
              </div>
            </div>
            <button
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                sonActif
                  ? "bg-q-level text-q-on"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={toggleSon}
              type="button"
            >
              {sonActif ? "Activé" : "Muet"}
            </button>
          </div>

          {/* Animations & Confettis */}
          <div className="surface-card flex items-center justify-between p-4 rounded-3xl">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <SparklesIcon className="size-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Célébrations & Animations
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Confettis de réussite et effets visuels doux.
                </span>
              </div>
            </div>
            <button
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
                animationsActives
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={toggleAnimations}
              type="button"
            >
              {animationsActives ? "Activé" : "Désactivé"}
            </button>
          </div>
        </div>

        {/* Objectif quotidien */}
        <div className="surface-card flex flex-col gap-3 p-5 rounded-3xl">
          <div className="flex items-center gap-2">
            <FlameIcon className="size-4 text-orange-500" />
            <h4 className="text-xs font-bold text-foreground">
              Objectif quotidien de révision
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DAILY_TARGETS.map((target) => {
              const actif = objectifQuiz === target.id;
              return (
                <button
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl border p-3 text-center transition-all cursor-pointer",
                    actif
                      ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30 text-foreground"
                      : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40"
                  )}
                  key={target.id}
                  onClick={() => changerObjectif(target.id)}
                  type="button"
                >
                  <span className="text-xs font-bold">{target.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {target.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. QUÊTES & RAPPELS */}
      <section className="flex flex-col gap-4 scroll-mt-24" id="quizzly-quetes">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            5. Série, Ligues & Notifications
          </h3>
          <p className="text-xs text-muted-foreground">
            Maintenez votre série active et restez motivé pour la compétition hebdomadaire.
          </p>
        </div>

        <div className="surface-card flex items-center justify-between p-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <BellIcon className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Rappel de série quotidienne
              </span>
              <span className="text-[11px] text-muted-foreground">
                Recevez une notification avant 20h si vous n'avez pas encore validé de quiz aujourd'hui.
              </span>
            </div>
          </div>
          <button
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer",
              rappelsActifs
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground"
            )}
            onClick={toggleRappels}
            type="button"
          >
            {rappelsActifs ? "Activé" : "Désactivé"}
          </button>
        </div>
      </section>
    </div>
  );
}
