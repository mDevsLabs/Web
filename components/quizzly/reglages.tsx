"use client";

import { useState } from "react";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { IconeClasse } from "@/components/quizzly/icones";
import { useResumeQuizzly } from "@/components/quizzly/shell";
import { IconeMatiere } from "@/components/quizzly/subject-icon";
import {
  libelleAnnee,
  PROGRAM,
  SCHOOL_YEARS,
  type SchoolYear,
} from "@/lib/quizzly/program";

export function ReglagesQuizzly() {
  const { data, error, isLoading, mutate } = useResumeQuizzly();
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(corps: {
    modelId?: string | null;
    schoolYear?: SchoolYear;
    subjects?: string[];
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
      setMessage("Réglage enregistré.");
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
      <p className="text-sm text-muted-foreground">Chargement des réglages…</p>
    );
  }
  if (error || !data) {
    return (
      <p className="text-sm text-destructive">
        Les réglages n'ont pas pu être chargés.
      </p>
    );
  }

  const annee = (
    SCHOOL_YEARS.includes(data.schoolYear as SchoolYear)
      ? data.schoolYear
      : "6e"
  ) as SchoolYear;
  const matieres = PROGRAM[annee];
  const suivies = new Set(data.subjects);

  function basculer(id: string) {
    const toutes = matieres.map((matiere) => matiere.id);
    const actuel = data && data.subjects.length > 0 ? data.subjects : toutes;
    const suivant = actuel.includes(id)
      ? actuel.filter((entree) => entree !== id)
      : [...actuel, id];
    if (suivant.length === 0) {
      setMessage("Gardez au moins une matière.");
      return;
    }
    enregistrer({
      subjects: suivant.length === toutes.length ? [] : suivant,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="surface-card flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Classe</h2>
        <div className="flex flex-wrap gap-2">
          {SCHOOL_YEARS.map((year) => (
            <button
              className="chip inline-flex items-center gap-2"
              data-active={year === annee ? "true" : "false"}
              disabled={enCours}
              key={year}
              onClick={() => enregistrer({ schoolYear: year })}
              type="button"
            >
              <IconeClasse
                className="inline-flex size-6 items-center justify-center rounded-full text-[9px] font-bold"
                year={year}
              />
              {libelleAnnee(year)}
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Matières</h2>
        <p className="text-xs text-muted-foreground">
          Sans sélection, le parcours montre toutes les matières de la classe.
          Changer de classe remet cette liste à zéro.
        </p>
        <div className="flex flex-wrap gap-2">
          {matieres.map((matiere) => {
            const active = suivies.size === 0 || suivies.has(matiere.id);
            return (
              <button
                className="chip inline-flex items-center gap-2"
                data-active={active ? "true" : "false"}
                disabled={enCours}
                key={matiere.id}
                onClick={() => basculer(matiere.id)}
                type="button"
              >
                <IconeMatiere id={matiere.id} />
                {matiere.label}
              </button>
            );
          })}
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
      <p className="text-xs text-muted-foreground">
        Le nom, le cadre et la carte à partager sont sur le profil Quizzly.
      </p>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
