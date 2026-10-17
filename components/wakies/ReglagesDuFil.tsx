"use client";

/**
 * Puce « Réglages de ce fil » — ce que les `@@` du fil ont réglé, et comment
 * en sortir.
 *
 * POURQUOI ELLE EXISTE
 *
 * `@@jeton` est un RÉGLAGE, pas une frappe : il écrit dans les colonnes de la
 * conversation et vaut pour tous les tours suivants. Sans surface qui le montre
 * et le retire, la fonctionnalité serait une dette immédiate — l'utilisateur
 * aurait ajouté un serveur MCP à son fil sans aucun moyen de savoir lequel, ni
 * de l'enlever autrement qu'en retapant le message. `@` disparaît avec le tour,
 * `@@` doit être visible.
 *
 * Les libellés viennent des mêmes sources que le sélecteur de capacités : une
 * puce qui afficherait un UUID n'informe pas, et une puce qui devinerait un nom
 * en inventerait un.
 */

import { api } from "@/components/wakies/api";
import { useCapabilities } from "@/components/wakies/CapacityPicker";
import type { Conversation, Space, Wakie } from "@/lib/wakies/shared/types";
import { WAKIE_TOOL_CATALOG } from "@/lib/wakies/tool-catalog";

type ColonneReglee =
  | "contextPageIds"
  | "contextSpaceIds"
  | "contextWakieIds"
  | "mcpServerIds"
  | "pluginIds"
  | "skillIds"
  | "toolIds";

type Entree = {
  colonne: ColonneReglee;
  id: string;
  nom: string;
  reste: string[];
};

export function ReglagesDuFil({
  conversation,
  espaces,
  onChange,
  wakies,
}: {
  conversation: Conversation;
  espaces?: Space[];
  onChange: () => void | Promise<void>;
  wakies?: Wakie[];
}) {
  const { capabilities } = useCapabilities(true);

  const nom = (colonne: ColonneReglee, id: string): string => {
    if (colonne === "toolIds") {
      return WAKIE_TOOL_CATALOG.find((outil) => outil.id === id)?.label ?? id;
    }
    if (colonne === "pluginIds") {
      return capabilities.extensions.find((item) => item.id === id)?.name ?? id;
    }
    if (colonne === "mcpServerIds") {
      return capabilities.serveurs.find((item) => item.id === id)?.name ?? id;
    }
    if (colonne === "skillIds") {
      return (
        capabilities.competences.find((item) => item.id === id)?.name ?? id
      );
    }
    if (colonne === "contextSpaceIds") {
      return (
        espaces?.find((espace) => espace.id === id)?.name ?? "Espace supprimé"
      );
    }
    if (colonne === "contextWakieIds") {
      return wakies?.find((item) => item.id === id)?.name ?? "Wakie supprimé";
    }
    // Une page n'est pas chargée ici : le fil n'en porte que l'identifiant.
    return "Page du workspace";
  };

  const colonnes: [ColonneReglee, string[] | null | undefined][] = [
    ["toolIds", conversation.toolIds],
    ["pluginIds", conversation.pluginIds],
    ["mcpServerIds", conversation.mcpServerIds],
    ["skillIds", conversation.skillIds],
    ["contextSpaceIds", conversation.contextSpaceIds],
    ["contextPageIds", conversation.contextPageIds],
    ["contextWakieIds", conversation.contextWakieIds],
  ];
  const entrrees: Entree[] = [];
  for (const [colonne, ids] of colonnes) {
    for (const id of ids ?? []) {
      entrrees.push({
        colonne,
        id,
        nom: nom(colonne, id),
        reste: (ids ?? []).filter((item) => item !== id),
      });
    }
  }
  if (entrrees.length === 0) return null;

  return (
    <details className="fil-reglages">
      <summary className="fil-reglages-resume">
        Réglages de ce fil
        <span className="fil-reglages-compteur">{entrrees.length}</span>
      </summary>
      <ul className="fil-reglages-liste">
        {entrrees.map((entree) => (
          <li key={`${entree.colonne}-${entree.id}`}>
            <span className="fil-reglages-nom">{entree.nom}</span>
            <button
              aria-label={`Retirer ${entree.nom} de ce fil`}
              className="icon-button"
              onClick={async () => {
                // Retirer la dernière entrée écrit `[]`, pas `null` : `null`
                // veut dire « reviens au réglage du Wakie », et effacer un
                // réglage explicite n'est pas le même geste.
                await api(`/conversations/${conversation.id}`, "PATCH", {
                  [entree.colonne]: entree.reste,
                });
                await onChange();
              }}
              type="button"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
