/**
 * ============================================================================
 * VIBE — SÉLECTEUR DE MODÈLE
 * ============================================================================
 *
 * Le sélecteur est celui du Chat et de l'Agent (`ModelSelectorCompact`) : même
 * recherche, mêmes pastilles de capacités, même sous-menu d'effort de
 * réflexion. Vibe n'ajoute que son type d'entrée historique (`AIModel`), pour
 * ne pas casser les appelants qui fournissent déjà une liste de secours.
 *
 * Le catalogue est relu sur `/api/models` afin de disposer des capacités et des
 * niveaux d'effort déclarés par le fournisseur : `/v1/models` ne les expose pas
 * toujours, et le menu ne doit pas inventer ce qu'un modèle sait faire.
 */

import type React from "react";
import useSWR from "swr";
import {
  ModelSelectorCompact,
  type SharedModel,
} from "@/components/chat/model-selector-compact";

export interface AIModel {
  contextWindow?: number;
  description?: string;
  id: string;
  name: string;
  provider?: string;
  tierRequired?: string;
}

interface ModelDropdownProps {
  className?: string;
  models: AIModel[];
  onSelectModel: (modelId: string) => void;
  selectedModelId: string;
}

type ModelsPayload = {
  capabilities?: Record<string, any>;
  models?: SharedModel[];
};

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  className = "",
}) => {
  const { data } = useSWR<ModelsPayload>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((response) => response.json()),
    { dedupingInterval: 60_000, revalidateOnFocus: false }
  );

  const catalogue = data?.models?.length ? data.models : models;

  return (
    <div className={className}>
      <ModelSelectorCompact
        capabilities={data?.capabilities}
        fallbackToFirst={false}
        models={catalogue}
        onModelChange={onSelectModel}
        selectedModelId={selectedModelId}
        source="chat"
      />
    </div>
  );
};
