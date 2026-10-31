"use client";

import { useState } from "react";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import {
  libelleAnnee,
  SCHOOL_YEARS,
  type SchoolYear,
} from "@/lib/quizzly/program";
import { classeCadre } from "@/lib/quizzly/shop";
import { cn } from "@/lib/utils";

export function ProfilQuizzly({
  integre = false,
}: {
  /** Dans les paramètres d'applications : pas de page autonome. */
  integre?: boolean;
} = {}) {
  const { data, error, isLoading, mutate } = useResumeQuizzly();
  const [nom, setNom] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(corps: {
    displayName?: string;
    equippedFrame?: string | null;
    modelId?: string | null;
    schoolYear?: SchoolYear;
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
          ? "Réglage enregistré."
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

  return (
    <section
      className={
        integre
          ? "flex flex-col gap-4"
          : "mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6"
      }
    >
      <div className="surface-card flex items-center gap-4">
        {data.avatarUrl ? (
          // L'avatar vient du compte : domaine déjà autorisé pour le profil mAI.
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
        <div>
          {integre ? (
            <p className="text-lg font-semibold">{data.displayName}</p>
          ) : (
            <h1 className="text-lg font-semibold">{data.displayName}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {data.xp} XP · {libelleAnnee(data.schoolYear as SchoolYear)}
          </p>
        </div>
      </div>

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
          Ce nom est celui du profil Vibe. Blackline l'affiche comme indicatif,
          tronqué à 18 caractères. Le @username de connexion ne change pas.
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
        <h2 className="text-sm font-semibold">Année scolaire</h2>
        <div className="flex flex-wrap gap-2">
          {SCHOOL_YEARS.map((annee) => (
            <button
              className="chip"
              data-active={annee === data.schoolYear ? "true" : "false"}
              disabled={enCours}
              key={annee}
              onClick={() => enregistrer({ schoolYear: annee })}
              type="button"
            >
              {libelleAnnee(annee)}
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Modèle du Coach</h2>
        <p className="text-xs text-muted-foreground">
          Ce modèle répond dans la section Coach. Sans choix, c'est le modèle
          par défaut du compte.
        </p>
        <ModelSelectorCompact
          allowEmpty
          disabled={enCours}
          emptyLabel="Modèle du compte"
          fallbackToFirst={false}
          onModelChange={(modelId) => {
            enregistrer({ modelId: modelId.trim() ? modelId.trim() : null });
          }}
          selectedModelId={data.modelId ?? ""}
          variant="block"
        />
      </div>

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
