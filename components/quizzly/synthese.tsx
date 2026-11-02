"use client";

import {
  BookOpenIcon,
  CheckIcon,
  GraduationCapIcon,
  LightbulbIcon,
  SearchIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from "@mdevs/icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import {
  FICHES_SYNTHESE,
  type FicheSynthese,
} from "@/lib/quizzly/synthese-data";
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
  { id: "anglais", label: "Anglais" },
  { id: "philosophie", label: "Philosophie" },
];

export function SyntheseQuizzly() {
  const resume = useResumeQuizzly();
  const niveauParDefaut = resume.data?.schoolYear ?? "tous";

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
          const matchSubject = fiche.subjectLabel.toLowerCase().includes(query);
          return matchTitle || matchSummary || matchKeyPoints || matchSubject;
        }
        return true;
      }),
    [niveauSelectionne, matiereSelectionnee, recherche]
  );

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      {/* Entête */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-q-xp">
          <GraduationCapIcon className="size-6" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Espace Révision & Synthèse
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Fiches de Synthèse & Essentiels du Cours
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Révisez les notions clés, les formules incontournables et les règles
          d'or avant de vous lancer dans les quiz ou après vos entraînements.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field-input w-full pl-10 pr-4 text-sm"
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une notion, théorème, formule, règle de grammaire..."
          type="search"
          value={recherche}
        />
      </div>

      {/* Filtres par Niveau */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Niveau scolaire :
        </span>
        <div className="flex flex-wrap gap-1.5">
          {NIVEAUX.map((n) => (
            <button
              className="chip text-xs"
              data-active={niveauSelectionne === n.id}
              key={n.id}
              onClick={() => setNiveauSelectionne(n.id)}
              type="button"
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres par Matière */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Matière :
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MATIERES.map((m) => (
            <button
              className="chip text-xs"
              data-active={matiereSelectionnee === m.id}
              key={m.id}
              onClick={() => setMatiereSelectionnee(m.id)}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des fiches */}
      <div className="flex flex-col gap-4">
        {fichesFiltrees.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground">
            <BookOpenIcon className="mx-auto mb-2 size-8 opacity-40" />
            <p className="text-sm font-medium">
              Aucune fiche de synthèse trouvée.
            </p>
            <p className="text-xs">
              Essayez d'élargir votre recherche ou de modifier les filtres de
              niveau.
            </p>
          </div>
        ) : (
          fichesFiltrees.map((fiche) => {
            const ouverte = ficheOuverte === fiche.id;
            return (
              <article
                className="surface-card flex flex-col gap-4 transition-all"
                key={fiche.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-q-xp/10 px-2 py-0.5 text-xs font-semibold text-q-xp">
                        {fiche.subjectLabel}
                      </span>
                      <div className="flex gap-1">
                        {fiche.schoolYears.map((an) => (
                          <span
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                            key={an}
                          >
                            {an}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {fiche.title}
                    </h2>
                  </div>
                  <button
                    className="chip text-xs font-medium"
                    data-active={ouverte}
                    onClick={() =>
                      setFicheOuverte((prev) =>
                        prev === fiche.id ? null : fiche.id
                      )
                    }
                    type="button"
                  >
                    {ouverte ? "Réduire" : "Consulter la fiche →"}
                  </button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {fiche.summary}
                </p>

                {/* Formule / Règle d'or mise en avant */}
                {fiche.formulaOrRule ? (
                  <div className="rounded-xl border border-q-xp/30 bg-q-xp/5 p-3.5 text-sm font-mono text-q-xp">
                    <span className="block text-xs uppercase font-sans font-bold tracking-wider text-muted-foreground mb-1">
                      Règle d'or / Formule clé
                    </span>
                    {fiche.formulaOrRule}
                  </div>
                ) : null}

                {/* Contenu détaillé déroulant */}
                {ouverte ? (
                  <div className="mt-2 flex flex-col gap-4 border-t border-border/60 pt-4">
                    {/* Points clés */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Points essentiels à retenir
                      </h3>
                      <ul className="grid gap-2 sm:grid-cols-1">
                        {fiche.keyPoints.map((point) => (
                          <li
                            className="flex items-start gap-2.5 text-sm"
                            key={point}
                          >
                            <span className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-500 shrink-0">
                              <CheckIcon className="size-3" />
                            </span>
                            <span className="leading-snug">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pièges classiques */}
                    {fiche.commonMistakes && fiche.commonMistakes.length > 0 ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                          <TriangleAlertIcon className="size-4" />
                          Pièges fréquents à éviter
                        </div>
                        <ul className="flex flex-col gap-1.5 text-xs sm:text-sm text-muted-foreground">
                          {fiche.commonMistakes.map((erreur) => (
                            <li className="flex items-start gap-2" key={erreur}>
                              <span className="text-amber-500 font-bold">
                                •
                              </span>
                              <span>{erreur}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Astuce mnémotechnique */}
                    {fiche.mnemonic ? (
                      <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 text-xs sm:text-sm text-sky-500 font-medium">
                        <LightbulbIcon className="size-4 shrink-0" />
                        <span>
                          <strong>Astuce mémo :</strong> {fiche.mnemonic}
                        </span>
                      </div>
                    ) : null}

                    {/* Actions d'entraînement */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Link
                        className="chip text-xs"
                        href={`/quizzly/coach?quiz=fiche&theme=${encodeURIComponent(fiche.title)}`}
                      >
                        <SparklesIcon className="size-3.5" />
                        Poser une question au Coach
                      </Link>
                      <Link
                        className="chip text-xs font-semibold"
                        data-active="true"
                        href="/quizzly"
                      >
                        S'entraîner sur le parcours →
                      </Link>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
