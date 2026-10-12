"use client";

/**
 * ============================================================================
 * Sélecteur de modèle d'un Wakie
 * ============================================================================
 *
 * CE QUE CE COMPOSANT REMPLACE
 *
 * `ModelSelectorCompact` fait le même travail pour le Chat et l'Agent, mais il
 * ne sait pas exprimer ce dont Wakies a besoin :
 *
 *   1. « Modèle du Wakie » — c'est-à-dire `model: null` sur la conversation.
 *      Le composant hôte ne connaît que des chaînes : son entrée vide émet `""`,
 *      et le schéma serveur refuse une chaîne vide (`z.string().trim().min(1)`).
 *      Il n'existe donc AUCUN moyen, aujourd'hui, de ramener une conversation au
 *      modèle de son Wakie. C'est ce composant qui l'ouvre.
 *   2. Un modèle qui ne lit pas les images, n'appelle pas d'outils ou ne raisonne
 *      pas doit le DIRE avant le choix, pas après la déception.
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
 * sont stylés ici. Comme le menu est hors de `.wakies-root`, ses styles
 * s'écrivent AVEC les classes de l'hôte : `wakies-host.css` est tenue par
 * tests/unit/wakies-style-isolation.test.ts d'ancrer toute règle sous
 * `.wakies-root`, et une règle posée là ne s'appliquerait pas au portail.
 *
 * POURQUOI LE CATALOGUE N'EST PLUS FILTRÉ SUR LES OUTILS
 *
 * Une première version ne proposait que les modèles acceptant les appels
 * d'outils structurés. Résultat : un compte ne voyait qu'une minorité du
 * catalogue, sans pouvoir choisir un modèle léger pour une conversation sans
 * extension — et sans comprendre pourquoi l'autre modèle « manquait ».
 * Le catalogue est donc servi en entier, chaque option portant ses capacités,
 * et le picker AVERTIT au lieu de MASQUER. Le serveur, lui, continue de
 * retirer les outils incompatibles (`app/(chat)/api/wakies/chat/route.ts`) :
 * cette notice anticipe ce qu'il dira, elle ne le remplace pas.
 */

import { ChevronDownIcon } from "@mdevs/icons/arrows/chevron-down";
import { CheckIcon } from "@mdevs/icons/controls/check";
import { Button } from "@mdevs/ui/primitives/button";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
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
import { cn } from "@/lib/utils";
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
   *appel de la sélection. `null` signifie « revenir au modèle du Wakie »,
   * ce qui est une intention DIFFÉRENTE de « ne rien changer » : le
   * formulaire ne doit jamais confondre les deux.
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
      reasoning?: boolean;
      tools?: boolean;
      vision?: boolean;
    }
  >;
  models?: SharedModel[];
};

type Capacites = NonNullable<ModelPayload["capabilities"]>[string];

/**
 * Ce que le modèle sait faire, en pastilles.
 *
 * Le catalogue est servi en entier : sans ces pastilles, choisir un modèle
 * textuel parmi trente autres revient à le découvrir après coup. On n'affiche
 * que les capacités présentes — une liste de « ce que ça ne fait pas » par
 * option serait illisible, et le serveur l'explique déjà quand une jointe
 * arrive à un modèle qui ne voit rien.
 */
function libellesDeCapacites(capacites: Capacites | undefined): string[] {
  if (!capacites) {
    return [];
  }
  const libelles: string[] = [];
  if (capacites.tools) {
    libelles.push("Outils");
  }
  if (capacites.image || capacites.vision) {
    libelles.push("Images");
  }
  if (capacites.file) {
    libelles.push("Documents");
  }
  if (capacites.reasoning) {
    libelles.push("Raisonnement");
  }
  return libelles;
}

export function ModelPicker({
  valeur,
  onChoisir,
  modeleEffectif,
  onCapacitesFichiers,
  onCapacitesPieces,
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

  const groupees = tous.reduce<Record<string, SharedModel[]>>(
    (accumulator, modele) => {
      const cle = resolveProviderKey(modele);
      (accumulator[cle] ??= []).push(modele);
      return accumulator;
    },
    {}
  );

  const modeleSelectionne = tous.find((modele) => modele.id === valeur);
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
  const nomDuModele = tous.find((modele) => modele.id === valeur)?.name;
  /** Nom du modèle réellement employé — le Wakie quand la conversation ne surcharge pas. */
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

  /**
   * Ce que le modèle effectivement sélectionné NE SAIT PAS faire.
   *
   * Ces avis ne décident rien : le serveur, lui, retire les outils incompatibles
   * et refuse la lecture d'une image que le modèle ne voit pas. Ils sont là parce
   * que cette perte est autrement invisible — l'utilisateur change de modèle, et
   * ses extensions cessent simplement de répondre.
   */
  const avis: string[] = [];
  if (capacitesEffectives) {
    if (!capacitesEffectives.tools) {
      avis.push(
        "Ce modèle n'appelle aucun outil : extensions, serveurs MCP et compétences seront ignorés."
      );
    }
    if (!accepteFichiers) {
      avis.push(
        "Les images et les documents joints ne seront pas lus par ce modèle."
      );
    }
  }

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button
          aria-label="Choisir le modèle IA"
          className={cn(
            "wakies-model-trigger",
            bloc && "wakies-model-trigger-block",
            disabled && "is-disabled"
          )}
          data-statut={valeur ? undefined : "identique-au-defaut"}
          data-testid="wakies-model-picker"
          disabled={disabled}
          title={
            valeur
              ? `Modèle choisi pour cette conversation${nomEffectif ? ` : ${nomEffectif}` : ""}`
              : `Aucun choix ici : ce fil utilise le modèle de son Wakie${nomEffectif ? ` (${nomEffectif})` : ""}`
          }
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
          {/* Le vide de `valeur` n'est pas une absence de modèle : c'est le
              modèle du Wakie, qu'il faut NOMMER pour que le réglage lisible. */}
          {!valeur && nomEffectif ? (
            <span className="wakies-model-defaut">{nomEffectif}</span>
          ) : null}
          <ChevronDownIcon size={14} />
        </Button>
      </ModelSelectorTrigger>
      {/* Le portail partagé doit dépasser le dialogue Wakies (z-index 90). */}
      <ModelSelectorContent
        side={bloc ? "bottom" : "top"}
        style={{ zIndex: 120 }}
      >
        <ModelSelectorInput
          aria-label="Rechercher un modèle IA"
          placeholder="Rechercher un modèle…"
        />
        {avis.length > 0 ? (
          <p className="border-b border-border/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
            {avis.join(" ")}
          </p>
        ) : null}
        <ModelSelectorList>
          {tous.length > 0 ? (
            <ModelSelectorEmpty>
              Aucun modèle ne correspond à votre recherche.
            </ModelSelectorEmpty>
          ) : null}
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
              {modeles.map((modele) => {
                const libelles = libellesDeCapacites(
                  data?.capabilities?.[modele.id]
                );
                return (
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
                      {libelles.length > 0 ? (
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {libelles.map((libelle) => (
                            <span
                              className="rounded-full border border-border/60 px-1.5 text-[10px] leading-4 text-muted-foreground"
                              key={libelle}
                            >
                              {libelle}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                    {valeur === modele.id ? (
                      <CheckIcon className="ml-auto" size={15} />
                    ) : null}
                  </ModelSelectorItem>
                );
              })}
            </ModelSelectorGroup>
          ))}
          {tous.length === 0 ? (
            <div className="wakies-model-vide">
              {isLoading
                ? "Chargement des modèles…"
                : error
                  ? "Le catalogue mAI est indisponible. Réessayez plus tard."
                  : "Aucun modèle n'est disponible pour votre compte."}
            </div>
          ) : null}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
