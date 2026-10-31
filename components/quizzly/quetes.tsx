"use client";

import { useState } from "react";
import useSWR from "swr";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { fetcher } from "@/lib/utils";

type Quete = {
  claimed: boolean;
  key: string;
  label: string;
  progress: number;
  reward: number;
  scope: "daily" | "weekly";
  target: number;
};

export function QuetesQuizzly() {
  const resume = useResumeQuizzly();
  const { data, error, isLoading, mutate } = useSWR<{ quests: Quete[] }>(
    "/api/quizzly/quetes",
    fetcher
  );
  const [message, setMessage] = useState<string | null>(null);

  async function reclamer(questKey: string) {
    setMessage(null);
    try {
      const reponse = await fetch("/api/quizzly/quetes", {
        body: JSON.stringify({ questKey }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Réclamation refusée.");
      }
      setMessage("Récompense ajoutée.");
      await mutate();
      await resume.mutate();
    } catch (raison) {
      setMessage(
        raison instanceof Error ? raison.message : "Réclamation refusée."
      );
    }
  }

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        Chargement des quêtes…
      </p>
    );
  }
  if (error || !data) {
    return (
      <p className="p-8 text-sm text-destructive">
        Les quêtes n'ont pas pu être chargées.
      </p>
    );
  }

  const groupes = [
    { id: "daily" as const, titre: "Aujourd'hui" },
    { id: "weekly" as const, titre: "Cette semaine" },
  ];

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-lg font-semibold">Quêtes</h1>
      {message ? <p className="text-sm">{message}</p> : null}
      {groupes.map((groupe) => (
        <div className="flex flex-col gap-3" key={groupe.id}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {groupe.titre}
          </h2>
          <ul className="flex flex-col gap-3">
            {data.quests
              .filter((quete) => quete.scope === groupe.id)
              .map((quete) => {
                const terminee = quete.progress >= quete.target;
                return (
                  <li
                    className="surface-card flex flex-col gap-2"
                    key={quete.key}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold">{quete.label}</h3>
                      <span className="text-xs text-info">
                        {quete.reward} gemmes
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {Math.min(quete.progress, quete.target)} / {quete.target}
                    </p>
                    <button
                      className="chip w-fit"
                      data-active={quete.claimed ? "true" : "false"}
                      disabled={!terminee || quete.claimed}
                      onClick={() => reclamer(quete.key)}
                      type="button"
                    >
                      {quete.claimed ? "Réclamée" : "Réclamer"}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </section>
  );
}
