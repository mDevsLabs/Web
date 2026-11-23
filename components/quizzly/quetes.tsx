"use client";

import { AlertCircleIcon } from "@mdevs/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { BarreMesure } from "@/components/quizzly/niveau";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import {
  playCorrectSound,
  playIncorrectSound,
} from "@/lib/quizzly/sound-effects";
import { cn, fetcher } from "@/lib/utils";

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
  const [message, setMessage] = useState<{
    erreur: boolean;
    texte: string;
  } | null>(null);
  const [fete, setFete] = useState<string | null>(null);
  const [refus, setRefus] = useState<{
    key: string;
    message: string;
    nonce: number;
  } | null>(null);
  const minuteurRefus = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (minuteurRefus.current !== null) {
        window.clearTimeout(minuteurRefus.current);
      }
    },
    []
  );

  function signalerIndisponible(questKey: string, texte: string) {
    playIncorrectSound();
    setRefus((actuel) => ({
      key: questKey,
      message: texte,
      nonce: (actuel?.nonce ?? 0) + 1,
    }));
    setMessage({ erreur: true, texte });
    toast.error(texte);
    if (minuteurRefus.current !== null) {
      window.clearTimeout(minuteurRefus.current);
    }
    minuteurRefus.current = window.setTimeout(() => {
      setRefus((actuel) => (actuel?.key === questKey ? null : actuel));
    }, 2600);
  }

  async function reclamer(quete: Quete) {
    if (quete.claimed) {
      signalerIndisponible(quete.key, "Cette récompense a déjà été réclamée.");
      return;
    }
    if (quete.progress < quete.target) {
      const restant = Math.max(1, quete.target - quete.progress);
      signalerIndisponible(
        quete.key,
        `Récompense indisponible : encore ${restant} objectif${restant > 1 ? "s" : ""} à atteindre (${quete.progress} / ${quete.target}).`
      );
      return;
    }
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
      playCorrectSound();
      setFete(quete.key);
      const gain =
        corps?.monnaie === "xp"
          ? `+${corps.recompense ?? quete.reward} XP`
          : `+${corps?.recompense ?? quete.reward} gemmes`;
      setMessage({ erreur: false, texte: gain });
      toast.success(`Récompense réclamée : ${gain}`);
      window.setTimeout(() => setFete(null), 1600);
      await mutate();
      await resume.mutate();
    } catch (raison) {
      signalerIndisponible(
        quete.key,
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
            className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              message.erreur ? "text-destructive" : "text-q-level"
            )}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 8 }}
            role={message.erreur ? "alert" : "status"}
          >
            {message.erreur ? (
              <AlertCircleIcon className="size-4 shrink-0" />
            ) : null}
            <span>{message.texte}</span>
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
                const estRefusee = refus?.key === quete.key;
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
                    className={cn(
                      "surface-card relative overflow-hidden transition-colors",
                      estRefusee &&
                        "border-destructive/60 ring-2 ring-destructive/30"
                    )}
                    key={quete.key}
                    layout
                  >
                    <motion.div
                      animate={
                        estRefusee
                          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                          : { x: 0 }
                      }
                      className="flex flex-col gap-3"
                      key={estRefusee ? `refus-${refus.nonce}` : "stable"}
                      transition={{ duration: 0.42, ease: "easeInOut" }}
                    >
                      <div
                        className={cn(
                          "absolute inset-y-0 left-0 w-1.5 transition-colors",
                          estRefusee ? "bg-destructive" : groupe.teinte
                        )}
                      />
                      <div className="flex items-start justify-between gap-3 pl-2">
                        <div>
                          <h3 className="text-sm font-semibold">
                            {quete.label}
                          </h3>
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
                      <div className="flex flex-col gap-1.5 pl-2">
                        <button
                          aria-disabled={!terminee || quete.claimed}
                          className={cn(
                            "chip w-fit transition-all",
                            (!terminee || quete.claimed) &&
                              "cursor-not-allowed opacity-70 hover:opacity-90"
                          )}
                          data-active={
                            quete.claimed || terminee ? "true" : "false"
                          }
                          onClick={() => {
                            void reclamer(quete);
                          }}
                          type="button"
                        >
                          {quete.claimed ? "Réclamée" : "Réclamer"}
                        </button>
                        <AnimatePresence>
                          {estRefusee && refus ? (
                            <motion.p
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-1.5 text-xs font-medium text-destructive"
                              exit={{ opacity: 0, y: -4 }}
                              initial={{ opacity: 0, y: -4 }}
                              role="alert"
                            >
                              <AlertCircleIcon className="size-3.5 shrink-0" />
                              <span>{refus.message}</span>
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.li>
                );
              })}
          </ul>
        </div>
      ))}
    </section>
  );
}
