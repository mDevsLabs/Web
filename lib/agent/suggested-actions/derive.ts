import "server-only";

import {
  SUGGESTED_ACTION_CATALOG,
  type SuggestedActionId,
  type ValidatedSuggestedAction,
} from "@/lib/agent/suggested-actions/registry";

// Dérivation déterministe des actions suggérées en fin de run. Le modèle ne
// propose rien ici : le serveur observe ce qui s'est réellement produit (outils
// activés, livrable produit, projet associé) et ne retient que les actions du
// registre qui restent compatibles. Zéro action est un résultat normal.
//
// Le payload est reconstruit côté serveur à partir de données réelles du run
// (jamais de texte libre du modèle) ; l'exécution revalide tout de toute façon
// (route dédiée + executeSuggestedAction).

export type SuggestedActionDisplay = {
  id: SuggestedActionId;
  label: string;
  payload: Record<string, unknown>;
};

export function deriveSuggestedActions(params: {
  enabledToolCategories: string[];
  hasArtifact: boolean;
  projectId: string | null;
  taskTitle: string | null;
}): SuggestedActionDisplay[] {
  const actions: SuggestedActionDisplay[] = [];
  const categories = new Set(params.enabledToolCategories);
  const baseTitle = (params.taskTitle ?? "Résultat Agent").slice(0, 120);

  // Livrable produit : les actions d'exploitation du résultat ont un sens.
  if (params.hasArtifact) {
    if (categories.has("artifact")) {
      actions.push({
        id: "create_report",
        label: SUGGESTED_ACTION_CATALOG.create_report.description,
        payload: { title: `Rapport — ${baseTitle}` },
      });
    }
    if (categories.has("files") || categories.has("artifact")) {
      actions.push({
        id: "export_csv",
        label: SUGGESTED_ACTION_CATALOG.export_csv.description,
        payload: { columns: [], title: `Export — ${baseTitle}` },
      });
    }
    if (params.projectId && categories.has("project")) {
      actions.push({
        id: "add_result_to_project",
        label: SUGGESTED_ACTION_CATALOG.add_result_to_project.description,
        payload: { projectId: params.projectId, title: baseTitle },
      });
    }
  }

  // Recherche web utilisée : poursuivre sur le même fil reste réaliste.
  if (categories.has("web")) {
    actions.push({
      id: "continue_research",
      label: SUGGESTED_ACTION_CATALOG.continue_research.description,
      payload: { followUp: `Approfondir : ${baseTitle}` },
    });
  }

  // Garde-fou affichage : identifiants du registre uniquement, au plus 3.
  return actions
    .filter((action) => action.id in SUGGESTED_ACTION_CATALOG)
    .slice(0, 3) as SuggestedActionDisplay[];
}

// Revalidation par le registre avant persistance : même contrat que les
// propositions du modèle, sans en dépendre. Une action dont le payload ne
// passe pas le schéma du registre est silencieusement écartée.
export function validateDerivedActions(params: {
  actions: SuggestedActionDisplay[];
  enabledToolCategories: string[];
}): ValidatedSuggestedAction[] {
  return params.actions
    .map((action) => ({ action: { ...action }, id: action.id }))
    .filter((candidate) => {
      const definition = SUGGESTED_ACTION_CATALOG[candidate.id];
      return definition.schema.safeParse(candidate.action.payload ?? {})
        .success;
    })
    .filter((candidate) =>
      SUGGESTED_ACTION_CATALOG[candidate.id].requiredToolCategories.some(
        (category) => params.enabledToolCategories.includes(category)
      )
    )
    .slice(0, 3) as ValidatedSuggestedAction[];
}
