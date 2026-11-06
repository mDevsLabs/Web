"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import useSWR from "swr";
import { BarreMesure } from "@/components/quizzly/niveau";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { fetcher } from "@/lib/utils";

type Quete = {
  claimed: boolean;
  description: string;
  key: string;
  label: string;
  monnaie: "gemmes" | "xp";
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
  const [fete, setFete] = useState<string | null>(null);

  async function reclamer(quete: Quete) {
    setMessage(null);
    try {
      const reponse = await fetch("/api/quizzly/quetes", {
        body: JSON.stringify({ questKey: quete.key }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const corps = (await reponse.json().catch(() => null)) as {
        message?: string;
        monnaie?: string;
        recompense?: number;
      } | null;
      if (!reponse.ok) {
        throw new Error(corps?.message || "Réclamation refusée.");
      }
      setFete(quete.key);
      setMessage(
        corps?.monnaie === "xp"
          ? `+${corps.recompense ?? quete.reward} XP`
          : `+${corps?.recompense ?? quete.reward} gemmes`
      );
      window.setTimeout(() => setFete(null), 1600);
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
    {
      id: "daily" as const,
      teinte: "bg-q-xp",
      texte: "text-q-xp",
      titre: "Aujourd'hui",
    },
    {
      id: "weekly" as const,
      teinte: "bg-q-gem",
      texte: "text-q-gem",
      titre: "Cette semaine",
    },
  ];

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Quêtes</h1>
        <p className="text-sm text-muted-foreground">
          Trois quêtes du jour, en XP. Cinq quêtes de la semaine, en gemmes.
        </p>
      </div>
      <AnimatePresence>
        {message ? (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-q-level"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 8 }}
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
      {groupes.map((groupe) => (
        <div className="flex flex-col gap-3" key={groupe.id}>
          <h2
            className={`text-xs font-semibold uppercase tracking-wide ${groupe.texte}`}
          >
            {groupe.titre}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.quests
              .filter((quete) => quete.scope === groupe.id)
              .map((quete) => {
                const terminee = quete.progress >= quete.target;
                const recompense =
                  quete.monnaie === "xp"
                    ? `${quete.reward} XP`
                    : `${quete.reward} gemmes`;
                return (
                  <motion.li
                    animate={
                      fete === quete.key
                        ? { scale: [1, 1.03, 1] }
                        : { scale: 1 }
                    }
                    className="surface-card relative flex flex-col gap-3 overflow-hidden"
                    key={quete.key}
                    layout
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1.5 ${groupe.teinte}`}
                    />
                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div>
                        <h3 className="text-sm font-semibold">{quete.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {quete.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold ${groupe.texte}`}
                      >
                        {recompense}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pl-2">
                      <BarreMesure
                        couleur={groupe.teinte}
                        label={quete.label}
                        max={quete.target}
                        valeur={quete.progress}
                      />
                      <p className="text-xs text-muted-foreground">
                        {Math.min(quete.progress, quete.target)} /{" "}
                        {quete.target}
                      </p>
                    </div>
                    <button
                      className="chip ml-2 w-fit"
                      data-active={quete.claimed || terminee ? "true" : "false"}
                      disabled={!terminee || quete.claimed}
                      onClick={() => reclamer(quete)}
                      type="button"
                    >
                      {quete.claimed ? "Réclamée" : "Réclamer"}
                    </button>
                  </motion.li>
                );
              })}
          </ul>
        </div>
      ))}
    </section>
  );
}
