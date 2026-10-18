"use client";

/**
 * ============================================================================
 * Sélecteur de modèle d'un Wakie
 * ============================================================================
 *
 * Le menu, la recherche, le survol et le sous-menu de réflexion viennent du
 * MÊME composant que le Chat et l'Agent (`ModelSelectorCompact`). Wakies ne
 * garde ici que ce qui lui est propre :
 *
 *   1. « Modèle du Wakie » — c'est-à-dire `model: null` sur la conversation.
 *      Le sélecteur partagé émet normalement `""` ; `onEmptySelect` lui fait
 *      émettre l'intention distincte que le serveur attend.
 *   2. Le calcul des capacités de pièces jointes, que le composer consomme.
 *
 * Le catalogue vient de `/api/models`, comme partout : c'est le serveur qui
 * connaît les vraies limites, jamais une heuristique côté client.
 */

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import {
  ModelSelectorCompact,
  type SharedModel,
} from "@/components/chat/model-selector-compact";
import { resolveWakieCatalogModel } from "@/lib/wakies/model";
import {
  type CapacitesPieces,
  capacitesPieces,
} from "@/lib/wakies/shared/model-attachments";

/** `model: null` — la conversation suit à nouveau le modèle de son Wakie. */
export const MODE_DEFAUT_WAKIE = "";

type ModelPickerProps = {
  /** Modèle actuellement utilisé. Vide = suivi du modèle du Wakie. */
  valeur: string;
  /**
   * Appel de la sélection. `null` signifie « revenir au modèle du Wakie »,
   * ce qui est une intention DIFFÉRENTE de « ne rien changer ».
   */
  onChoisir: (modele: string | null) => void;
  /** Identifiant effectif quand la conversation suit le modèle du Wakie. */
  modeleEffectif?: string;
  /** Informe le composer des capacités du modèle réellement sélectionné. */
  onCapacitesFichiers?: (accepte: boolean) => void;
  onCapacitesPieces?: (capacites: CapacitesPieces) => void;
  /** Rendu en pleine largeur (dialogue de personnalisation). */
  bloc?: boolean;
  disabled?: boolean;
};

type ModelPayload = {
  capabilities?: Record<
    string,
    {
      file?: boolean;
      image?: boolean;
      maxFiles?: number;
      reasoning?: boolean;
      reasoningLevels?: string[];
      tools?: boolean;
      vision?: boolean;
    }
  >;
  models?: SharedModel[];
};

export function ModelPicker({
  valeur,
  onChoisir,
  modeleEffectif,
  onCapacitesFichiers,
  onCapacitesPieces,
  bloc = false,
  disabled = false,
}: ModelPickerProps) {
  const { data } = useSWR<ModelPayload>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Catalogue mAI indisponible.");
      return response.json();
    },
    { dedupingInterval: 60_000, revalidateOnFocus: true }
  );

  const tous = data?.models ?? [];
  const idEffectif = valeur || modeleEffectif || resolveWakieCatalogModel(tous);
  const capacitesEffectives = data?.capabilities?.[idEffectif];
  const piecesSupportees = useMemo(
    () => capacitesPieces(capacitesEffectives),
    [capacitesEffectives]
  );
  const accepteFichiers = Boolean(
    capacitesEffectives?.file ||
      capacitesEffectives?.image ||
      capacitesEffectives?.vision
  );
  const nomEffectif =
    tous.find((modele) => modele.id === idEffectif)?.name ||
    (tous.length ? idEffectif : undefined);

  useEffect(() => {
    onCapacitesFichiers?.(accepteFichiers);
    onCapacitesPieces?.(piecesSupportees);
  }, [
    accepteFichiers,
    onCapacitesFichiers,
    onCapacitesPieces,
    piecesSupportees,
  ]);

  return (
    <div
      className={bloc ? "w-full" : "min-w-0"}
      data-testid="wakies-model-picker"
      title={
        valeur
          ? `Modèle choisi pour cette conversation${nomEffectif ? ` : ${nomEffectif}` : ""}`
          : `Aucun choix ici : ce fil utilise le modèle de son Wakie${nomEffectif ? ` (${nomEffectif})` : ""}`
      }
    >
      <ModelSelectorCompact
        allowEmpty
        capabilities={data?.capabilities as any}
        disabled={disabled}
        emptyLabel={
          nomEffectif ? `Modèle du Wakie · ${nomEffectif}` : "Modèle du Wakie"
        }
        fallbackToFirst={false}
        models={tous}
        onEmptySelect={() => onChoisir(null)}
        onModelChange={(id) => onChoisir(id || null)}
        selectedModelId={valeur}
        source="chat"
        variant={bloc ? "block" : "compact"}
      />
    </div>
  );
}
