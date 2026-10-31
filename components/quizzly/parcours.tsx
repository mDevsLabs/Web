"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { MentionIa } from "@/components/quizzly/signalement";
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
            Le parcours s'ouvre sur cette année. Vous pourrez en changer dans le
            profil.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.years.map((year) => (
              <button
                className="chip"
                disabled={enregistrement}
                key={year}
                onClick={() => choisir(year)}
                type="button"
              >
                {libelleAnnee(year)}
              </button>
            ))}
          </div>
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
    <section className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {data.years.map((year) => (
          <button
            className="chip"
            data-active={year === data.year ? "true" : "false"}
            key={year}
            onClick={() => {
              setAnneeDemandee(year);
              setMatiereId(null);
            }}
            type="button"
          >
            {libelleAnnee(year)}
          </button>
        ))}
      </div>
      {data.subjects.length === 0 ? (
        <div className="surface-muted p-4 text-sm text-muted-foreground">
          Aucun chapitre n'est encore disponible pour cette année.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {data.subjects.map((entree) => (
              <button
                className="chip"
                data-active={entree.id === matiere?.id ? "true" : "false"}
                key={entree.id}
                onClick={() => setMatiereId(entree.id)}
                type="button"
              >
                {entree.label}
              </button>
            ))}
          </div>
          {matiere?.chapters.map((chapitre) => (
            <article className="flex flex-col gap-4" key={chapitre.id}>
              <h2 className="text-base font-semibold">{chapitre.title}</h2>
              {chapitre.units.map((unite) => (
                <div className="flex flex-col gap-3" key={unite.id}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {unite.title}
                  </h3>
                  <ol className="flex flex-col items-center gap-3">
                    {unite.quizzes.map((quiz, index) => (
                      <li key={quiz.id}>
                        {quiz.unlocked ? (
                          <Link
                            className={cn(
                              "flex size-14 items-center justify-center rounded-full border text-sm font-semibold",
                              quiz.passed
                                ? "border-success bg-success/10 text-success"
                                : "border-foreground bg-foreground text-background"
                            )}
                            href={`/quizzly/quiz/${quiz.id}`}
                          >
                            {index + 1}
                          </Link>
                        ) : (
                          <span className="flex size-14 items-center justify-center rounded-full border border-border text-sm text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <MentionIa />
            </article>
          ))}
        </>
      )}
    </section>
  );
}
