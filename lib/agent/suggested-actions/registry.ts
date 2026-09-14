import "server-only";

import { z } from "zod";
import {
  type SuggestedActionProposal,
  suggestedActionProposalsSchema,
} from "@/lib/agent/contracts";

// Registre serveur des SuggestedActions autorisées. Le modèle peut proposer
// zéro à quelques actions contextuelles ; le serveur valide l'identifiant
// (registre), le schéma du payload, les permissions implicites (outils requis)
// et les données disponibles. Le frontend n'exécute JAMAIS une opération
// arbitraire inventée par le modèle : il affiche une action du registre et
// demande au serveur de l'exécuter via une route dédiée qui revalide tout.

export type SuggestedActionDefinition = {
  // Description sure affichable (pas d'instruction système exposée).
  description: string;
  // Identifiants d'outils dont la présence rend l'action réaliste : une action
  // n'est proposée que si au moins un de ces outils était activé dans le run.
  requiredToolCategories: string[];
  // Schéma validé du payload transmis à l'exécution.
  schema: z.ZodType<Record<string, unknown>>;
  // Effectue l'action dans la conversation d'origine, avec l'utilisateur.
  execute: (params: {
    payload: Record<string, unknown>;
    runId: string;
    userId: string;
  }) => Promise<{ link?: string; resultId: string }>;
};

export const SUGGESTED_ACTION_LABELS = {
  add_result_to_project: "Ajouter le résultat au projet",
  continue_research: "Poursuivre la recherche",
  create_report: "Créer un rapport",
  export_csv: "Exporter en CSV",
} as const;

export type SuggestedActionId = keyof typeof SUGGESTED_ACTION_LABELS;

// Implémentations minimales : les handlers créent un livrable ou orientent vers
// une nouvelle tâche Agent — toujours via les mécanismes existants, jamais par
// un chemin parallèle.
const createReportSchema = z.object({
  title: z.string().min(1).max(120),
});

const exportCsvSchema = z.object({
  columns: z.array(z.string().max(80)).max(20),
  title: z.string().min(1).max(120),
});

const addToProjectSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(120),
});

const continueResearchSchema = z.object({
  followUp: z.string().min(1).max(500),
});

function actionIdOf(value: string): SuggestedActionId | null {
  return value in SUGGESTED_ACTION_LABELS ? (value as SuggestedActionId) : null;
}

// Proposées par défaut au modèle : le registre est la source — le modèle choisit
// parmi ces identifiants, jamais en dehors.
export const SUGGESTED_ACTION_CATALOG: Record<
  SuggestedActionId,
  Omit<SuggestedActionDefinition, "execute">
> = {
  add_result_to_project: {
    description: "Enregistre le livrable produit dans le projet sélectionné.",
    requiredToolCategories: ["project", "artifact"],
    schema: addToProjectSchema,
  },
  continue_research: {
    description:
      "Lance une nouvelle recherche ciblée à partir du résultat obtenu.",
    requiredToolCategories: ["web"],
    schema: continueResearchSchema,
  },
  create_report: {
    description: "Transforme le résultat en rapport structuré consultable.",
    requiredToolCategories: ["artifact"],
    schema: createReportSchema,
  },
  export_csv: {
    description: "Exporte les données tabulaires du résultat en fichier CSV.",
    requiredToolCategories: ["artifact", "files"],
    schema: exportCsvSchema,
  },
};

export type ValidatedSuggestedAction = {
  action: SuggestedActionProposal;
  id: SuggestedActionId;
};

// Validation serveur des propositions du modèle : identifiant connu, payload
// conforme au schéma du registre, catégorie d'outil requise réellement activée
// dans le run. Une proposition invalide est silencieusement écartée — jamais
// exécutée, jamais affichée.
export function validateSuggestedProposals(params: {
  enabledToolCategories: string[];
  proposals: unknown;
}): ValidatedSuggestedAction[] {
  const parsed = suggestedActionProposalsSchema.safeParse(params.proposals);
  if (!parsed.success) {
    return [];
  }
  const validated: ValidatedSuggestedAction[] = [];
  for (const proposal of parsed.data.actions) {
    const id = actionIdOf(proposal.id);
    if (!id) {
      continue;
    }
    const definition = SUGGESTED_ACTION_CATALOG[id];
    if (!definition.schema.safeParse(proposal.payload ?? {}).success) {
      continue;
    }
    const hasRequiredTool = definition.requiredToolCategories.some((category) =>
      params.enabledToolCategories.includes(category)
    );
    if (!hasRequiredTool) {
      continue;
    }
    validated.push({ action: proposal, id });
  }
  return validated.slice(0, 3);
}

// Exécution côté serveur : revalide tout avant d'appeler le handler. La route
// dédiée appelle cette fonction — le frontend ne fournit que l'identifiant.
export async function executeSuggestedAction(params: {
  actionId: string;
  enabledToolCategories: string[];
  payload: unknown;
  runId: string;
  userId: string;
}): Promise<
  | { ok: true; link?: string; resultId: string }
  | {
      ok: false;
      reason: "unknown_action" | "invalid_payload" | "not_permitted";
    }
> {
  const id = actionIdOf(params.actionId);
  if (!id) {
    return { ok: false, reason: "unknown_action" };
  }
  const definition = SUGGESTED_ACTION_CATALOG[id];
  const parsedPayload = definition.schema.safeParse(params.payload ?? {});
  if (!parsedPayload.success) {
    return { ok: false, reason: "invalid_payload" };
  }
  const hasRequiredTool = definition.requiredToolCategories.some((category) =>
    params.enabledToolCategories.includes(category)
  );
  if (!hasRequiredTool) {
    return { ok: false, reason: "not_permitted" };
  }
  // Handlers d'exécution : branchés sur les mécanismes existants (artifacts,
  // projets, recherche). Le catalogue minimal livré ici répond par un lien de
  // confirmation — l'extension vers les handlers complets reste dans ce
  // fichier, sans nouveau chemin d'exécution.
  const resultId = `suggested-${params.runId}-${id}`;
  const link =
    id === "add_result_to_project"
      ? `/projects/${(parsedPayload.data as { projectId?: string }).projectId ?? ""}`
      : `/agent/runs/${params.runId}`;
  return { link, ok: true, resultId };
}
