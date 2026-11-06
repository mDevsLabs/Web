"use client";

import { CheckIcon, ChevronDownIcon, LockIcon } from "@mdevs/icons";
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

function MenuDeroulant({
  desactive,
  libelle,
  onChoisir,
  options,
  valeur,
}: {
  desactive?: boolean;
  libelle: string;
  onChoisir: (id: string) => void;
  options: { id: string; label: string }[];
  valeur: string;
}) {
  const actif = options.find((option) => option.id === valeur);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="chip inline-flex items-center gap-2"
        data-active="true"
        disabled={desactive}
        type="button"
      >
        <span className="text-muted-foreground">{libelle}</span>
        <span>{actif?.label ?? "Choisir"}</span>
        <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80">
        {options.map((option) => (
          <DropdownMenuItem
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
      <p className="p-8 text-sm text-muted-foreground">
        Chargement du parcours…
      </p>
    );
  }

  if (error || resume.error) {
    return (
      <p className="p-8 text-sm text-destructive">
        Le parcours n'a pas pu être chargé.
      </p>
    );
  }

  if (!data) {
    return null;
  }

  if (!data.yearChosen) {
    return (
      <section className="mx-auto flex max-w-lg flex-col gap-4 p-6">
        <div className="surface-card flex flex-col gap-4">
          <h1 className="text-lg font-semibold">Quelle est votre année ?</h1>
          <p className="text-sm text-muted-foreground">
            Le parcours s'ouvre sur cette année. Vous pourrez en changer dans
            les paramètres d'applications.
          </p>
          <MenuDeroulant
            desactive={enregistrement}
            libelle="Classe"
            onChoisir={(id) => choisir(id as SchoolYear)}
            options={data.years.map((year) => ({
              id: year,
              label: libelleAnnee(year),
            }))}
            valeur=""
          />
          {message ? (
            <p className="text-sm text-destructive">{message}</p>
          ) : null}
        </div>
      </section>
    );
  }

  const matiere =
    data.subjects.find((entree) => entree.id === matiereId) ?? data.subjects[0];

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:flex-row sm:p-6">
      {/* Barre sticky compacte sur mobile : sélecteur de classe à gauche et rail de matières à droite */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-2 flex items-center gap-2 border-b border-border/40 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:hidden">
        <div className="shrink-0">
          <MenuDeroulant
            libelle="Classe"
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
        {data.subjects.length === 0 ? null : (
          <nav
            aria-label="Matières (mobile)"
            className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
          >
            {data.subjects.map((entree) => (
              <button
                className="chip inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-xs"
                data-active={entree.id === matiere?.id ? "true" : "false"}
                key={entree.id}
                onClick={() => setMatiereId(entree.id)}
                type="button"
              >
                <IconeMatiere id={entree.id} />
                <span>{entree.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Volet latéral sticky sur grand écran */}
      <div className="sticky top-4 hidden max-h-[calc(100dvh-5rem)] w-64 shrink-0 self-start flex-col gap-3 overflow-y-auto sm:flex">
        <MenuDeroulant
          libelle="Classe"
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
        {data.subjects.length === 0 ? null : (
          <nav aria-label="Matières" className="flex flex-col gap-1">
            {data.subjects.map((entree) => (
              <button
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-2 py-2 text-left text-sm font-semibold",
                  entree.id === matiere?.id
                    ? "bg-q-level/15 text-foreground"
                    : "text-muted-foreground hover:bg-q-shop/10"
                )}
                key={entree.id}
                onClick={() => setMatiereId(entree.id)}
                type="button"
              >
                <IconeMatiere id={entree.id} />
                {entree.label}
              </button>
            ))}
          </nav>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {data.subjects.length === 0 ? (
          <div className="surface-muted p-4 text-sm text-muted-foreground">
            Aucun chapitre n'est encore disponible pour cette année.
          </div>
        ) : (
          matiere?.chapters.map((chapitre) => (
            <article className="flex flex-col gap-4" key={chapitre.id}>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                {matiere ? <IconeMatiere id={matiere.id} /> : null}
                {chapitre.title}
              </h2>
              {chapitre.units.map((unite) => {
                const courant = unite.quizzes.find(
                  (quiz) => quiz.unlocked && !quiz.passed
                );
                return (
                  <div className="flex flex-col gap-3" key={unite.id}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-q-quest">
                      {unite.title}
                    </h3>
                    <ol className="relative flex flex-col items-center gap-3 py-2">
                      <span className="absolute top-4 bottom-4 w-1 rounded-full bg-q-path/35" />
                      {unite.quizzes.map((quiz, index) => (
                        <li className="relative" key={quiz.id}>
                          {quiz.unlocked ? (
                            <Link
                              className={cn(
                                "flex size-14 items-center justify-center rounded-full border text-sm font-semibold shadow-md",
                                quiz.passed
                                  ? "border-q-xp bg-q-xp text-q-on"
                                  : "border-q-level bg-q-level text-q-on",
                                quiz.id === courant?.id && "q-float"
                              )}
                              href={`/quizzly/quiz/${quiz.id}`}
                            >
                              {quiz.passed ? (
                                <CheckIcon className="size-5" />
                              ) : (
                                index + 1
                              )}
                            </Link>
                          ) : (
                            <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background text-sm text-muted-foreground">
                              <LockIcon className="size-4" />
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
              <MentionIa />
            </article>
          ))
        )}
      </div>
    </section>
  );
}
