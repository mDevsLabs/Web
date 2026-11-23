"use client";

import { AlertCircleIcon } from "@mdevs/icons";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "framer-motion";
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

type GroupeQuete = {
  id: "daily" | "weekly";
  teinte: string;
  texte: string;
  titre: string;
};

type RefusQuete = {
  key: string;
  message: string;
  nonce: number;
};

function CarteQuete({
  estFetee,
  estRefusee,
  groupe,
  onReclamer,
  quete,
  refus,
}: {
  estFetee: boolean;
  estRefusee: boolean;
  groupe: GroupeQuete;
  onReclamer: (quete: Quete) => void;
  quete: Quete;
  refus: RefusQuete | null;
}) {
  const [carteRef, animer] = useAnimate<HTMLLIElement>();
  const economieMvt = useReducedMotion();
  const nonceRefus = estRefusee ? (refus?.nonce ?? 0) : 0;

  useEffect(() => {
    if (nonceRefus === 0 || !carteRef.current) {
      return;
    }
    const modeEconomie =
      economieMvt || document.documentElement.dataset.economy === "true";
    if (modeEconomie) {
      return;
    }
    // Secousse discrète de la carte entière (bordure et liseré solidaires)
    // sans démontage du bouton ni saut de mise en page.
    void animer(
      carteRef.current,
      { x: [0, -4, 4, -2, 0] },
      { duration: 0.28, ease: "easeInOut" }
    );
  }, [animer, carteRef, economieMvt, nonceRefus]);

  useEffect(() => {
    if (!estFetee || !carteRef.current) {
      return;
    }
    const modeEconomie =
      economieMvt || document.documentElement.dataset.economy === "true";
    if (modeEconomie) {
      return;
    }
    void animer(
      carteRef.current,
      { scale: [1, 1.02, 1] },
      { duration: 0.35, ease: "easeOut" }
    );
  }, [animer, carteRef, economieMvt, estFetee]);

  const terminee = quete.progress >= quete.target;
  const recompense =
    quete.monnaie === "xp" ? `${quete.reward} XP` : `${quete.reward} gemmes`;

  return (
    <li
      className={cn(
        "surface-card relative overflow-hidden transition-colors",
        estRefusee && "border-destructive/45 ring-1 ring-destructive/20"
      )}
      ref={carteRef}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 transition-colors",
          estRefusee ? "bg-destructive/80" : groupe.teinte
        )}
      />
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 pl-2">
          <div>
            <h3 className="text-sm font-semibold">{quete.label}</h3>
            <p className="text-sm text-muted-foreground">{quete.description}</p>
          </div>
          <span className={`shrink-0 text-xs font-semibold ${groupe.texte}`}>
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
            {Math.min(quete.progress, quete.target)} / {quete.target}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 pl-2">
          <button
            aria-disabled={!terminee && !quete.claimed}
            className={cn(
              "chip w-fit transition-colors",
              quete.claimed && "cursor-default opacity-60",
              !terminee &&
                !quete.claimed &&
                "cursor-not-allowed opacity-60 hover:border-border/80 hover:bg-transparent hover:text-muted-foreground"
            )}
            data-active={quete.claimed || terminee ? "true" : "false"}
            disabled={quete.claimed}
            onClick={() => {
              onReclamer(quete);
            }}
            type="button"
          >
            {quete.claimed ? "Réclamée" : "Réclamer"}
          </button>
          <AnimatePresence initial={false}>
            {estRefusee && refus ? (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs font-medium text-destructive"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0, y: -2 }}
                role="alert"
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <AlertCircleIcon className="size-3.5 shrink-0" />
                <span>{refus.message}</span>
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </li>
  );
}

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
    }, 1800);
  }

  async function reclamer(quete: Quete) {
    if (quete.claimed) {
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
              .map((quete) => (
                <CarteQuete
                  estFetee={fete === quete.key}
                  estRefusee={refus?.key === quete.key}
                  groupe={groupe}
                  key={quete.key}
                  onReclamer={(cible) => {
                    void reclamer(cible);
                  }}
                  quete={quete}
                  refus={refus}
                />
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
