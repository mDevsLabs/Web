"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
  SparklesIcon,
} from "@mdevs/icons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { MentionIa } from "@/components/quizzly/signalement";
import { IconeMatiere } from "@/components/quizzly/subject-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";
import { cn, fetcher } from "@/lib/utils";

type QuizNode = {
  id: string;
  passed: boolean;
  title: string;
  unlocked: boolean;
};

type Parcours = {
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
  yearChosen: boolean;
  years: SchoolYear[];
};

function MenuDeroulantClasse({
  desactive,
  onChoisir,
  options,
  valeur,
}: {
  desactive?: boolean;
  onChoisir: (id: string) => void;
  options: { id: string; label: string }[];
  valeur: string;
}) {
  const actif = options.find((option) => option.id === valeur);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-blue-200/80 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-xs transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:border-blue-900/60 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        disabled={desactive}
        type="button"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="text-slate-400 dark:text-slate-500">🎓</span>
          <span className="truncate">
            {actif?.label ?? "Choisir la classe"}
          </span>
        </span>
        <ChevronDownIcon className="size-3.5 text-slate-400 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 w-56 rounded-2xl p-1.5 shadow-lg border-blue-100 dark:border-blue-950">
        {options.map((option) => (
          <DropdownMenuItem
            className={cn(
              "cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold",
              option.id === valeur &&
                "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
            )}
            key={option.id}
            onSelect={() => onChoisir(option.id)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function envoyer(url: string, body: unknown) {
  const reponse = await fetch(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
  const corps = (await reponse.json().catch(() => null)) as {
    message?: string;
  } | null;
  if (!reponse.ok) {
    throw new Error(corps?.message || "La requête a échoué.");
  }
}

export function ParcoursQuizzly() {
  const resume = useResumeQuizzly();
  const [anneeDemandee, setAnneeDemandee] = useState<string | null>(null);
  const annee = anneeDemandee ?? resume.data?.schoolYear;
  const { data, error, isLoading, mutate } = useSWR<Parcours>(
    annee ? `/api/quizzly/parcours?year=${annee}` : null,
    fetcher
  );
  const [matiereId, setMatiereId] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function choisir(year: SchoolYear) {
    setEnregistrement(true);
    setMessage(null);
    try {
      await envoyer("/api/quizzly/profil", { schoolYear: year });
      setAnneeDemandee(year);
      await resume.mutate();
      await mutate();
    } catch (erreur) {
      setMessage(
        erreur instanceof Error
          ? erreur.message
          : "Impossible d'enregistrer l'année."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  if (resume.isLoading || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Chargement du parcours…</span>
        </div>
      </div>
    );
  }

  if (error || resume.error) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-destructive">
        Le parcours n'a pas pu être chargé.
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.yearChosen) {
    return (
      <section className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <div className="surface-quizzly-card flex flex-col gap-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
            <SparklesIcon className="size-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Quelle est votre classe ?
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Le parcours s'adapte à votre niveau scolaire. Vous pourrez changer à
            tout moment dans les réglages.
          </p>
          <MenuDeroulantClasse
            desactive={enregistrement}
            onChoisir={(id) => choisir(id as SchoolYear)}
            options={data.years.map((year) => ({
              id: year,
              label: libelleAnnee(year),
            }))}
            valeur=""
          />
          {message ? (
            <p className="text-xs text-destructive">{message}</p>
          ) : null}
        </div>
      </section>
    );
  }

  const matiere =
    data.subjects.find((entree) => entree.id === matiereId) ?? data.subjects[0];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Barre compacte mobile pour la classe et le rail de matières */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-2 flex items-center gap-2 border-b border-blue-100 bg-white/95 px-4 py-2.5 backdrop-blur-md sm:hidden dark:border-blue-900/40 dark:bg-slate-900/95">
        <div className="w-36 shrink-0">
          <MenuDeroulantClasse
            onChoisir={(id) => {
              setAnneeDemandee(id);
              setMatiereId(null);
            }}
            options={data.years.map((year) => ({
              id: year,
              label: libelleAnnee(year),
            }))}
            valeur={data.year}
          />
        </div>
        {data.subjects.length > 0 && (
          <nav
            aria-label="Matières (mobile)"
            className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
          >
            {data.subjects.map((entree) => (
              <button
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
                  entree.id === matiere?.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
                key={entree.id}
                onClick={() => setMatiereId(entree.id)}
                type="button"
              >
                <IconeMatiere className="size-3.5" id={entree.id} />
                <span>{entree.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Volet Latéral des Matières (Desktop - 3.5 / 12) */}
        <aside className="sticky top-6 hidden max-h-[calc(100dvh-6rem)] shrink-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-500/5 sm:flex lg:col-span-3 dark:border-blue-900/40 dark:bg-slate-900">
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ma classe
            </span>
            <MenuDeroulantClasse
              onChoisir={(id) => {
                setAnneeDemandee(id);
                setMatiereId(null);
              }}
              options={data.years.map((year) => ({
                id: year,
                label: libelleAnnee(year),
              }))}
              valeur={data.year}
            />
          </div>

          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Matières au programme
            </span>
            <nav aria-label="Matières" className="flex flex-col gap-1">
              {data.subjects.map((entree) => {
                const actif = entree.id === matiere?.id;
                return (
                  <button
                    className={cn(
                      "group flex items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-bold transition-all",
                      actif
                        ? "bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                    )}
                    key={entree.id}
                    onClick={() => setMatiereId(entree.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconeMatiere className="size-4" id={entree.id} />
                      <span className="truncate">{entree.label}</span>
                    </div>
                    {actif && (
                      <span className="text-blue-600 dark:text-blue-400">
                        &gt;
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Espace Central d'Apprentissage (9 / 12) */}
        <main className="flex min-w-0 flex-1 flex-col gap-6 lg:col-span-9">
          {data.subjects.length === 0 ? (
            <div className="surface-quizzly-card p-6 text-center text-sm text-slate-500">
              Aucun chapitre n'est encore disponible pour cette classe.
            </div>
          ) : (
            matiere?.chapters.map((chapitre, chapIndex) => (
              <section
                className="surface-quizzly-card relative overflow-hidden bg-white p-6 sm:p-8 dark:bg-slate-900"
                key={chapitre.id}
              >
                {/* En-tête du Chapitre */}
                <div className="flex flex-col justify-between gap-4 border-b border-blue-100/80 pb-6 sm:flex-row sm:items-center dark:border-blue-900/30">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <span>{matiere.label}</span>
                      <span>›</span>
                      <span>Chapitre {chapIndex + 1}</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                      {chapitre.title}
                    </h1>
                  </div>

                  {/* Mascotte Quizzy décorative en haut à droite */}
                  <div className="q-float relative hidden size-20 shrink-0 sm:block">
                    <Image
                      alt="Quizzy"
                      className="object-contain"
                      fill
                      priority={chapIndex === 0}
                      sizes="80px"
                      src="/quizzly/quizzy.png"
                    />
                  </div>
                </div>

                {/* Unités du chapitre avec chemin ondulé/horizontal */}
                <div className="mt-8 flex flex-col gap-10">
                  {chapitre.units.map((unite) => {
                    const courant = unite.quizzes.find(
                      (quiz) => quiz.unlocked && !quiz.passed
                    );

                    return (
                      <div className="flex flex-col gap-4" key={unite.id}>
                        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          {unite.title}
                        </h2>

                        {/* Chemin horizontal serpentin avec ligne pointillée */}
                        <div className="relative py-4">
                          <ol className="flex flex-wrap items-start justify-start gap-6 sm:gap-10">
                            {unite.quizzes.map((quiz, quizIdx) => {
                              const estCourant = quiz.id === courant?.id;

                              return (
                                <li
                                  className="group relative flex flex-col items-center text-center"
                                  key={quiz.id}
                                  style={{ width: "100px" }}
                                >
                                  {quiz.unlocked ? (
                                    <Link
                                      className={cn(
                                        "relative flex size-16 items-center justify-center rounded-full text-base font-black transition-all shadow-md",
                                        quiz.passed
                                          ? "border-2 border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/20 hover:scale-105"
                                          : estCourant
                                            ? "border-3 border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20 q-float hover:scale-105"
                                            : "border-2 border-blue-400 bg-blue-500 text-white shadow-blue-500/20 hover:scale-105"
                                      )}
                                      href={`/quizzly/quiz/${quiz.id}`}
                                      title={quiz.title}
                                    >
                                      {/* Étoiles décoratives pour le quiz en cours */}
                                      {estCourant && (
                                        <div className="absolute -top-1 -right-1 text-amber-400">
                                          <SparklesIcon className="size-4" />
                                        </div>
                                      )}

                                      {quiz.passed ? (
                                        <CheckIcon className="size-6 stroke-[3]" />
                                      ) : (
                                        <span>{quizIdx + 1}</span>
                                      )}
                                    </Link>
                                  ) : (
                                    <div
                                      className="flex size-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 shadow-inner dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-600"
                                      title={quiz.title}
                                    >
                                      <LockIcon className="size-5" />
                                    </div>
                                  )}

                                  {/* Titre de l'étape sous le nœud */}
                                  <span className="mt-2.5 line-clamp-2 text-[11px] font-bold leading-tight text-slate-700 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">
                                    {quiz.title}
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <MentionIa />
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
