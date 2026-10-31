"use client";

import { useState } from "react";
import { partagerProfil } from "@/components/quizzly/carte-partage";
import { IconeClasse, IconeLigue, nomLigue } from "@/components/quizzly/icones";
import { BarreNiveau } from "@/components/quizzly/niveau";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { estLigue } from "@/lib/quizzly/leagues";
import { libelleAnnee, type SchoolYear } from "@/lib/quizzly/program";
import { classeCadre } from "@/lib/quizzly/shop";
import { cn } from "@/lib/utils";

export function ProfilQuizzly() {
  const { data, error, isLoading, mutate } = useResumeQuizzly();
  const [nom, setNom] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(corps: {
    displayName?: string;
    equippedFrame?: string | null;
  }) {
    setEnCours(true);
    setMessage(null);
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
      setMessage(
        corps.displayName === undefined
          ? "Cadre enregistré."
          : "Profil enregistré. Le nom est aussi celui de Vibe et de Blackline."
      );
      if (corps.displayName !== undefined) {
        setNom(null);
      }
      await mutate();
    } catch (raison) {
      setMessage(
        raison instanceof Error ? raison.message : "Enregistrement refusé."
      );
    } finally {
      setEnCours(false);
    }
  }

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">Chargement du profil…</p>
    );
  }
  if (error || !data) {
    return (
      <p className="p-8 text-sm text-destructive">
        Le profil n'a pas pu être chargé.
      </p>
    );
  }

  const valeurNom = nom ?? data.displayName;
  const initiale = data.displayName.slice(0, 1).toUpperCase() || "?";
  const ligue = estLigue(data.league) ? data.league : "bronze";
  const annee = data.schoolYear as SchoolYear;

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
      <div className="surface-card flex items-center gap-4">
        {data.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className={cn(
              "size-16 rounded-full object-cover",
              classeCadre(data.equippedFrame)
            )}
            src={data.avatarUrl}
          />
        ) : (
          <span
            className={cn(
              "flex size-16 items-center justify-center rounded-full bg-muted text-lg font-semibold",
              classeCadre(data.equippedFrame)
            )}
          >
            {initiale}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{data.displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {data.username ? `@${data.username}` : "Quizzly"}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
            <IconeLigue league={ligue} />
            {nomLigue(ligue)}
          </p>
        </div>
      </div>

      <BarreNiveau
        niveau={data.niveau}
        xpDansPalier={data.xpDansPalier}
        xpPalier={data.xpPalier}
      />

      <ul className="grid grid-cols-2 gap-3">
        <li className="surface-card flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">XP totale</span>
          <span className="text-lg font-semibold">{data.xp}</span>
        </li>
        <li className="surface-card flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Série en cours</span>
          <span className="text-lg font-semibold">{data.streakCount}</span>
        </li>
        <li className="surface-card flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Série record</span>
          <span className="text-lg font-semibold">{data.streakBest}</span>
        </li>
        <li className="surface-card flex items-center gap-2">
          <IconeClasse year={annee} />
          <span className="text-sm font-semibold">{libelleAnnee(annee)}</span>
        </li>
      </ul>

      <button
        className="chip w-fit"
        data-active="true"
        onClick={() => {
          partagerProfil({
            avatarUrl: data.avatarUrl,
            displayName: data.displayName,
            league: ligue,
            schoolYear: data.schoolYear,
            streakBest: data.streakBest,
            streakCount: data.streakCount,
            username: data.username,
            xp: data.xp,
          }).then((issue) => {
            if (issue === "downloaded") {
              setMessage("Image téléchargée.");
            }
          });
        }}
        type="button"
      >
        Partager en image
      </button>

      <form
        className="surface-card flex flex-col gap-3"
        onSubmit={(evenement) => {
          evenement.preventDefault();
          enregistrer({ displayName: valeurNom });
        }}
      >
        <label className="text-xs font-semibold" htmlFor="quizzly-nom">
          Nom affiché
        </label>
        <input
          className="field-input"
          id="quizzly-nom"
          maxLength={40}
          onChange={(evenement) => setNom(evenement.target.value)}
          value={valeurNom}
        />
        <p className="text-xs text-muted-foreground">
          Ce nom est celui du profil Vibe. Blackline l'affiche comme indicatif.
          Le @username ne change pas. La classe et les matières se règlent dans
          les paramètres d'applications.
        </p>
        <button
          className="chip w-fit"
          data-active="true"
          disabled={enCours}
          type="submit"
        >
          Enregistrer le nom
        </button>
      </form>

      <div className="surface-card flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Cadre</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="chip"
            data-active={data.equippedFrame === null ? "true" : "false"}
            disabled={enCours}
            onClick={() => enregistrer({ equippedFrame: null })}
            type="button"
          >
            Aucun
          </button>
          {data.ownedFrames.map((cadre) => (
            <button
              className="chip"
              data-active={data.equippedFrame === cadre ? "true" : "false"}
              disabled={enCours}
              key={cadre}
              onClick={() => enregistrer({ equippedFrame: cadre })}
              type="button"
            >
              {cadre}
            </button>
          ))}
        </div>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}
