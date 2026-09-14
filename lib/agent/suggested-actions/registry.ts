import "server-only";

import { z } from "zod";
import {
  type SuggestedActionProposal,
  suggestedActionProposalsSchema,
} from "@/lib/agent/contracts";
import {
  getAgentRunById,
  getAgentStepsByRunId,
  getToolExecutionsByRunId,
} from "@/lib/db/agent-queries";
import {
  attachDocumentToProject,
  getDocumentById,
  getProjectById,
  saveDocument,
} from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

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
};

// Les handlers vivent dans `executeSuggestedAction` ci-dessous : ils s'appuient
// sur les mécanismes existants (documents, projets, composer) et jamais sur un
// chemin d'exécution parallèle.

export const SUGGESTED_ACTION_LABELS = {
  add_result_to_project: "Ajouter le résultat au projet",
  continue_research: "Poursuivre la recherche",
  create_report: "Créer un rapport",
  export_csv: "Exporter en CSV",
} as const;

export type SuggestedActionId = keyof typeof SUGGESTED_ACTION_LABELS;

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
export type SuggestedActionFailureReason =
  | "invalid_payload"
  | "no_result"
  | "not_found"
  | "not_permitted"
  | "unknown_action";

type RunResultContext = {
  hasArtifact: boolean;
  latestDocumentId: string | null;
  latestTitle: string;
  steps: Awaited<ReturnType<typeof getAgentStepsByRunId>>;
};

function readDocumentId(output: unknown): string | null {
  if (!output || typeof output !== "object") {
    return null;
  }
  const candidate = (output as { documentId?: unknown }).documentId;
  return typeof candidate === "string" && candidate ? candidate : null;
}

// Le résultat réel du run est relu depuis la base (steps + livrables produits)
// puis transformé par les mêmes mécanismes que les outils : aucun chemin
// d'exécution parallèle, aucune donnée inventée.
async function loadRunResult(params: {
  runId: string;
  userId: string;
}): Promise<RunResultContext | null> {
  const run = await getAgentRunById({
    id: params.runId,
    userId: params.userId,
  });
  if (!run) {
    return null;
  }
  const [steps, executions] = await Promise.all([
    getAgentStepsByRunId({ runId: params.runId }),
    getToolExecutionsByRunId({ runId: params.runId }),
  ]);

  let latestDocumentId: string | null = null;
  let latestTitle = "";
  for (const execution of executions) {
    const documentId = readDocumentId(execution.output);
    if (documentId) {
      latestDocumentId = documentId;
      latestTitle = "";
    }
  }
  const artifactStep = [...steps]
    .reverse()
    .find((step) => step.type === "artifact");
  if (artifactStep?.summary) {
    latestTitle = artifactStep.summary;
  }

  return {
    hasArtifact: Boolean(latestDocumentId),
    latestDocumentId,
    latestTitle,
    steps,
  };
}

function buildReport(params: {
  context: RunResultContext;
  title: string;
}): string {
  const lines = [`# ${params.title}`, ""];
  if (params.context.hasArtifact) {
    lines.push(
      "## Livrable produit",
      params.context.latestTitle
        ? `- ${params.context.latestTitle}`
        : "- Livrable attaché à ce run",
      "",
      "> Consultez le livrable correspondant dans vos documents pour le détail.",
      ""
    );
  }
  lines.push("## Déroulé de la tâche", "");
  for (const step of params.context.steps) {
    const summary = step.summary ? ` — ${step.summary}` : "";
    lines.push(
      `- [${step.status}] ${step.title} (${step.type})${summary}`.slice(0, 400)
    );
  }
  lines.push(
    "",
    "---",
    "Rapport généré à partir des étapes réellement exécutées par Agent."
  );
  return lines.join("\n");
}

function buildCsv(context: RunResultContext): string {
  const header = "index;type;statut;titre;resume";
  const rows = context.steps.map((step) =>
    [step.index, step.type, step.status, step.title, step.summary ?? ""]
      .map((value) => String(value).replace(/[\r\n;]/g, " "))
      .join(";")
  );
  return [header, ...rows].join("\n");
}

// Exécution côté serveur : revalide tout avant d'agir (identifiant du registre,
// schéma du payload, outils réellement activés lors du run, propriété du run et
// des objets touchés). Chaque handler s'appuie sur les mécanismes existants.
export async function executeSuggestedAction(params: {
  actionId: string;
  enabledToolCategories: string[];
  payload: unknown;
  runId: string;
  userId: string;
}): Promise<
  | { ok: true; link?: string; resultId: string }
  | { ok: false; reason: SuggestedActionFailureReason }
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

  const context = await loadRunResult({
    runId: params.runId,
    userId: params.userId,
  });
  if (!context) {
    return { ok: false, reason: "not_found" };
  }

  if (id === "add_result_to_project") {
    const projectId = (parsedPayload.data as { projectId: string }).projectId;
    const project = await getProjectById({
      id: projectId,
      userEmail: "",
      userId: params.userId,
    }).catch(() => null);
    if (!project) {
      return { ok: false, reason: "not_found" };
    }
    if (!context.latestDocumentId) {
      // Sans livrable réel, il n'y a rien à conserver dans le projet : mieux
      // vaut le dire que créer un résultat vide.
      return { ok: false, reason: "no_result" };
    }
    const document_ = await getDocumentById({
      id: context.latestDocumentId,
    }).catch(() => null);
    if (!document_ || document_.userId !== params.userId) {
      return { ok: false, reason: "not_found" };
    }
    const attached = await attachDocumentToProject({
      documentId: context.latestDocumentId,
      projectId,
      userId: params.userId,
    }).catch(() => null);
    if (!attached) {
      return { ok: false, reason: "not_found" };
    }
    return {
      link: `/projects/${projectId}`,
      ok: true,
      resultId: context.latestDocumentId,
    };
  }

  if (id === "continue_research") {
    const followUp = (parsedPayload.data as { followUp: string }).followUp;
    const run = await getAgentRunById({
      id: params.runId,
      userId: params.userId,
    }).catch(() => null);
    if (!run) {
      return { ok: false, reason: "not_found" };
    }
    // Relance une nouvelle tâche préremplie dans la même conversation :
    // mécanisme existant du composer (?query=), aucun nouveau chemin.
    return {
      link: `/chat/${run.chatId}?query=${encodeURIComponent(followUp)}`,
      ok: true,
      resultId: run.chatId,
    };
  }

  const title = (parsedPayload.data as { title: string }).title;
  const documentId = generateUUID();
  const isCsv = id === "export_csv";
  const content = isCsv ? buildCsv(context) : buildReport({ context, title });

  try {
    await saveDocument({
      content,
      id: documentId,
      kind: isCsv ? "sheet" : "text",
      title,
      userId: params.userId,
    });
  } catch {
    return { ok: false, reason: "not_found" };
  }

  return {
    link: `/api/document?id=${documentId}`,
    ok: true,
    resultId: documentId,
  };
}
