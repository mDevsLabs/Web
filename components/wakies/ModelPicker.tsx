"use client";

/**
 * ============================================================================
 * Sélecteur de modèle d'un Wakie
 * ============================================================================
 *
 * CE QUE CE COMPOSANT REMPLACE
 *
 * `ModelSelectorCompact` fait le même travail pour le Chat et l'Agent, mais il
 * ne sait pas exprimer deux choses dont Wakies a besoin :
 *
 *   1. « Modèle du Wakie » — c'est-à-dire `model: null` sur la conversation.
 *      Le composant hôte ne connaît que des chaînes : son entrée vide émet `""`,
 *      et le schéma serveur refuse une chaîne vide (`z.string().trim().min(1)`).
 *      Il n'existe donc AUCUN moyen, aujourd'hui, de ramener une conversation au
 *      modèle de son Wakie. C'est ce composant qui l'ouvre.
 *   2. Le filtre « modèle sans appel d'outils ». Une conversation qui a des
 *      Skills, des Plugins ou des serveurs MCP sélectionnés ne peut pas les
 *      utiliser avec un modèle incapable d'émettre des appels d'outils
 *      structurés : le modèle les ignorerait silencieusement. LesSuch
 *      modèles sont donc retirés de la liste quand des outils sont actifs.
 *
 * DONNÉES
 *
 * Le catalogue vient de `/api/models`, comme le composant hôte. Les
 * capabilities sont lues dans la même réponse : c'est le serveur qui connaît
 * les vraies limites, pas une heuristique côté client.
 *
 * PRÉSENTATION
 *
 * Les primitives viennent de `@/components/ai-elements/model-selector`. Le
 * MENU est porté par un portail vers `document.body`, donc hors de
 * `.wakies-root` : il garde exactement l'apparence du Chat, et c'est voulu
 * (voir l'en-tête de `wakies-host.css`). Seuls le déclencheur et le contenu
 * sont stylés ici.
 */

import { ChevronDownIcon } from "@mdevs/icons/arrows/chevron-down";
import { CheckIcon } from "@mdevs/icons/controls/check";
import { Button } from "@mdevs/ui/primitives/button";
import { useState } from "react";
import useSWR from "swr";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PROVIDER_NAMES,
  resolveProviderKey,
  type SharedModel,
} from "@/components/chat/model-selector-compact";
import { agentCompatibilityFor } from "@/lib/ai/registry/capabilities";
import { cn } from "@/lib/utils";

/** `model: null` — la conversation suit à nouveau le modèle de son Wakie. */
export const MODE_DEFAUT_WAKIE = "";

type ModelPickerProps = {
  /** Modèle actuellement utilisé. Vide = suivi du modèle du Wakie. */
  valeur: string;
  /**
   *appel de la sélection. `null` signifie « revenir au modèle du Wakie »,
   * ce qui est une intention DIFFÉRENTE de « ne rien changer » : le
   * formulaire ne doit jamais confondre les deux.
   */
  onChoisir: (modele: string | null) => void;
  /** Des outils sont-ils actifs ? Si oui, on retire les modèles incapables. */
  outilsActifs?: boolean;
  /** Rendu en pleine largeur (dialogue de personnalisation). */
  bloc?: boolean;
  disabled?: boolean;
};

type ModelPayload = {
  capabilities?: Record<string, { tools?: boolean }>;
  models?: SharedModel[];
};

export function ModelPicker({
  valeur,
  onChoisir,
  outilsActifs = false,
  bloc = false,
  disabled = false,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const { data, error, isLoading } = useSWR<ModelPayload>(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Catalogue mAI indisponible.");
      return response.json();
    },
    { dedupingInterval: 60_000, revalidateOnFocus: true }
  );

  const tous = data?.models ?? [];
  const sansOutils = tous.filter((modele) => {
    if (!outilsActifs) {
      return true;
    }
    const compatibilite = agentCompatibilityFor(
      modele.id,
      data?.capabilities?.[modele.id]?.tools === true
    );
    return compatibilite.structuredToolCalls && compatibilite.toolDefinitions;
  });

  const groupees = sansOutils.reduce<Record<string, SharedModel[]>>(
    (accumulator, modele) => {
      const cle = resolveProviderKey(modele);
      (accumulator[cle] ??= []).push(modele);
      return accumulator;
    },
    {}
  );

  const modeleSelectionne = tous.find((modele) => modele.id === valeur);
  const nomDuModele =
    sansOutils.find((modele) => modele.id === valeur)?.name ??
    tous.find((modele) => modele.id === valeur)?.name;

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button
          className={cn(
            "wakies-model-trigger",
            bloc && "wakies-model-trigger-block",
            disabled && "is-disabled"
          )}
          data-testid="wakies-model-picker"
          disabled={disabled}
          type="button"
          variant="ghost"
        >
          {modeleSelectionne ? (
            <ModelSelectorLogo
              provider={resolveProviderKey(modeleSelectionne)}
            />
          ) : null}
          <ModelSelectorName>
            {valeur
              ? (nomDuModele ?? "Modèle indisponible")
              : "Modèle du Wakie"}
          </ModelSelectorName>
          <ChevronDownIcon size={14} />
        </Button>
      </ModelSelectorTrigger>
      {/* Le portail partagé doit dépasser le dialogue Wakies (z-index 90). */}
      <ModelSelectorContent
        side={bloc ? "bottom" : "top"}
        style={{ zIndex: 120 }}
      >
        <ModelSelectorInput placeholder="Rechercher un modèle…" />
        <ModelSelectorList>
          {/* L'entrée « modèle du Wakie » est l'ABSENCE de choix de modèle,
              pas un modèle nommé : elle émet `null`. */}
          <ModelSelectorItem
            className="wakies-model-option"
            onSelect={() => {
              setOpen(false);
              onChoisir(null);
            }}
            value="Modèle du Wakie"
          >
            <ModelSelectorLogo provider="mai" />
            <span>Modèle du Wakie</span>
            {valeur ? null : <CheckIcon className="ml-auto" size={15} />}
          </ModelSelectorItem>
          {Object.entries(groupees).map(([cle, modeles]) => (
            <ModelSelectorGroup
              heading={PROVIDER_NAMES[cle.toLowerCase()] || cle.toUpperCase()}
              key={cle}
            >
              {modeles.map((modele) => (
                <ModelSelectorItem
                  className="wakies-model-option"
                  key={modele.id}
                  onSelect={() => {
                    setOpen(false);
                    onChoisir(modele.id);
                  }}
                  value={`${modele.name} ${modele.id} ${modele.description ?? ""}`}
                >
                  <ModelSelectorLogo provider={cle} />
                  <div className="flex min-w-0 flex-col">
                    <ModelSelectorName>{modele.name}</ModelSelectorName>
                    {modele.description ? (
                      <span className="line-clamp-1 text-[11px] opacity-70">
                        {modele.description}
                      </span>
                    ) : null}
                  </div>
                  {valeur === modele.id ? (
                    <CheckIcon className="ml-auto" size={15} />
                  ) : null}
                </ModelSelectorItem>
              ))}
            </ModelSelectorGroup>
          ))}
          {sansOutils.length === 0 ? (
            <div className="wakies-model-vide">
              {isLoading
                ? "Chargement des modèles…"
                : error
                  ? "Le catalogue mAI est indisponible. Réessayez plus tard."
                  : outilsActifs
                    ? "Aucun modèle disponible ne prend en charge les outils sélectionnés."
                    : "Aucun modèle disponible pour votre compte."}
            </div>
          ) : null}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
