"use client";

import {
  ArrowRightIcon,
  BotIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  LightbulbIcon,
  SearchIcon,
  SparklesIcon,
  TriangleAlertIcon,
  XIcon,
} from "@mdevs/icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { IconeMatiere } from "@/components/quizzly/subject-icon";
import { FICHES_SYNTHESE } from "@/lib/quizzly/synthese-data";
import { cn } from "@/lib/utils";

const NIVEAUX = [
  { id: "tous", label: "Tous niveaux" },
  { id: "6e", label: "6e" },
  { id: "5e", label: "5e" },
  { id: "4e", label: "4e" },
  { id: "3e", label: "3e" },
  { id: "2nde", label: "2nde" },
  { id: "1ere", label: "1ère" },
  { id: "terminale", label: "Terminale" },
];

const MATIERES = [
  { id: "toutes", label: "Toutes matières" },
  { id: "francais", label: "Français" },
  { id: "mathematiques", label: "Mathématiques" },
  { id: "histoire-geographie", label: "Histoire-Géo" },
  { id: "svt", label: "SVT" },
  { id: "physique-chimie", label: "Physique-Chimie" },
  { id: "ses", label: "SES" },
  { id: "nsi", label: "NSI" },
  { id: "anglais", label: "Anglais" },
  { id: "espagnol", label: "Espagnol" },
  { id: "philosophie", label: "Philosophie" },
];

export function SyntheseQuizzly() {
  const resume = useResumeQuizzly();
  const _niveauCompte = resume.data?.schoolYear;

  const [niveauSelectionne, setNiveauSelectionne] = useState<string>("tous");
  const [matiereSelectionnee, setMatiereSelectionnee] =
    useState<string>("toutes");
  const [recherche, setRecherche] = useState("");
  const [ficheOuverte, setFicheOuverte] = useState<string | null>(null);

  const fichesFiltrees = useMemo(
    () =>
      FICHES_SYNTHESE.filter((fiche) => {
        if (
          niveauSelectionne !== "tous" &&
          !fiche.schoolYears.includes(niveauSelectionne)
        ) {
          return false;
        }
        if (
          matiereSelectionnee !== "toutes" &&
          fiche.subjectId !== matiereSelectionnee
        ) {
          return false;
        }
        if (recherche.trim()) {
          const query = recherche.toLowerCase().trim();
          const matchTitle = fiche.title.toLowerCase().includes(query);
          const matchSummary = fiche.summary.toLowerCase().includes(query);
          const matchKeyPoints = fiche.keyPoints.some((p) =>
            p.toLowerCase().includes(query)
          );
          const matchFormula = fiche.formulaOrRule
            ?.toLowerCase()
            .includes(query);
          const matchSubject = fiche.subjectLabel.toLowerCase().includes(query);
          return (
            matchTitle ||
            matchSummary ||
            matchKeyPoints ||
            matchFormula ||
            matchSubject
          );
        }
        return true;
      }),
    [niveauSelectionne, matiereSelectionnee, recherche]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* En-tête de section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <GraduationCapIcon className="size-5" />
          <span className="text-xs font-black uppercase tracking-wider">
            Espace Révision & Synthèse
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Fiches de Synthèse & Essentiels du Cours
        </h1>
        <p className="max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-300">
          Révisez les notions clés, les formules incontournables et les règles
          d'or pour vos devoirs et examens.
        </p>
      </div>

      {/* Barre de Recherche Moderne */}
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-2xl border border-blue-200/80 bg-white py-3.5 pr-4 pl-12 text-sm font-medium text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-blue-900/60 dark:bg-slate-900 dark:text-white"
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une notion, théorème, formule, règle de grammaire…"
          type="text"
          value={recherche}
        />
        {recherche && (
          <button
            className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={() => setRecherche("")}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Barre des Filtres (Niveau scolaire & Matière) */}
      <div className="flex flex-col gap-3">
        {/* Niveaux scolaires */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 min-w-24">
            Niveau scolaire :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {NIVEAUX.map((niv) => {
              const actif = niveauSelectionne === niv.id;
              return (
                <button
                  className={cn(
                    "cursor-pointer rounded-full px-3.5 py-1 text-xs font-bold transition-all",
                    actif
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  )}
                  key={niv.id}
                  onClick={() => setNiveauSelectionne(niv.id)}
                  type="button"
                >
                  {niv.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matières */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 min-w-24">
            Matière :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MATIERES.map((mat) => {
              const actif = matiereSelectionnee === mat.id;
              return (
                <button
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all",
                    actif
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  )}
                  key={mat.id}
                  onClick={() => setMatiereSelectionnee(mat.id)}
                  type="button"
                >
                  {mat.id !== "toutes" && (
                    <IconeMatiere className="size-3.5" id={mat.id} />
                  )}
                  <span>{mat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Liste des Fiches de Synthèse */}
      <div className="mt-2 flex flex-col gap-4">
        {fichesFiltrees.length === 0 ? (
          <div className="surface-quizzly-card p-12 text-center">
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              Aucune fiche ne correspond à votre recherche.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Essayez d'ajuster les filtres de niveau ou de matière.
            </p>
          </div>
        ) : (
          fichesFiltrees.map((fiche) => {
            const ouverte = ficheOuverte === fiche.id;

            return (
              <div
                className="surface-quizzly-card group flex flex-col gap-4 p-5 sm:p-6 transition-all hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-500/10 dark:hover:border-blue-800"
                key={fiche.id}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex flex-1 flex-col gap-2">
                    {/* Badges matière & classes */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                        <IconeMatiere
                          className="size-3.5"
                          id={fiche.subjectId}
                        />
                        <span>{fiche.subjectLabel}</span>
                      </span>

                      {fiche.schoolYears.map((annee) => (
                        <span
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          key={annee}
                        >
                          {annee}
                        </span>
                      ))}
                    </div>

                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {fiche.title}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {fiche.summary}
                    </p>
                  </div>

                  {/* Formule clé / Règle d'or mise en valeur */}
                  {fiche.formulaOrRule && (
                    <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 to-indigo-50/50 p-3 sm:p-4 text-left lg:max-w-md shrink-0 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/30">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Règle d'or / Formule clé
                      </span>
                      <p className="mt-1 font-mono text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-100">
                        {fiche.formulaOrRule}
                      </p>
                    </div>
                  )}

                  {/* Bouton Consulter / Replier */}
                  <div className="shrink-0">
                    <button
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-500 active:scale-95"
                      onClick={() => setFicheOuverte(ouverte ? null : fiche.id)}
                      type="button"
                    >
                      <span>{ouverte ? "Masquer" : "Consulter la fiche"}</span>
                      {ouverte ? (
                        <ChevronDownIcon className="size-3.5 rotate-180 transition-transform" />
                      ) : (
                        <ArrowRightIcon className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Contenu Déplié de la Fiche */}
                {ouverte && (
                  <div className="mt-4 flex flex-col gap-5 border-t border-blue-100/80 pt-5 dark:border-blue-900/40">
                    {/* Points clés */}
                    <div>
                      <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Ce qu'il faut retenir absolument :
                      </h3>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {fiche.keyPoints.map((point) => (
                          <li
                            className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                            key={point}
                          >
                            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              ✓
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pièges fréquents & Mnémonique */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {fiche.commonMistakes.length > 0 && (
                        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-950 dark:bg-rose-950/20">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                            <TriangleAlertIcon className="size-4" />
                            <span>Pièges fréquents à éviter :</span>
                          </div>
                          <ul className="flex flex-col gap-1.5">
                            {fiche.commonMistakes.map((erreur) => (
                              <li
                                className="text-xs font-medium text-rose-900 dark:text-rose-200"
                                key={erreur}
                              >
                                • {erreur}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fiche.mnemonic && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-950 dark:bg-amber-950/20">
                          <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <LightbulbIcon className="size-4" />
                            <span>Astuce mnémonique :</span>
                          </div>
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                            {fiche.mnemonic}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Passerelle directe vers le Coach mAI avec le contexte */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50/60 p-4 dark:bg-blue-950/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                        <BotIcon className="size-4 text-blue-600" />
                        <span>
                          Une question ou un exercice sur ce chapitre ?
                        </span>
                      </div>
                      <Link
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-500"
                        href={`/quizzly/coach?sheet=${encodeURIComponent(fiche.id)}&subject=${encodeURIComponent(fiche.subjectId)}&title=${encodeURIComponent(fiche.title)}`}
                      >
                        <SparklesIcon className="size-3.5" />
                        <span>Réviser cette notion avec le Coach mAI</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
