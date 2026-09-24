import type { ZodType } from "zod";
import type { AgentMode } from "@/lib/agent/channel";
import type { ToolErrorCategory } from "@/lib/agent/tool-errors";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";

// Types du domaine Agent. Aucun `any` : unions discriminées aux frontières
// (surtout des outils, dont le résultat est toujours structuré) et types
// sérialisables pour tout ce qui traverse le flux.

export type { AgentMode } from "@/lib/agent/channel";
export type { ReasoningLevel } from "@/lib/ai/registry/reasoning";

export type AgentRunStatus =
  | "queued"
  | "running"
  | "waiting_for_tool"
  | "waiting_for_approval"
  | "waiting_for_user"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

export const ACTIVE_AGENT_RUN_STATUSES: AgentRunStatus[] = [
  "queued",
  "running",
  "waiting_for_tool",
  "waiting_for_approval",
  "waiting_for_user",
];

export function isActiveRunStatus(status: AgentRunStatus): boolean {
  return ACTIVE_AGENT_RUN_STATUSES.includes(status);
}

// Statuts « terminés » incluant timed_out : le travail réalisé reste consultable
// et peut être repris dans un nouveau run.
export const TERMINAL_AGENT_RUN_STATUSES: AgentRunStatus[] = [
  "completed",
  "failed",
  "cancelled",
  "timed_out",
];

export type AgentStepType =
  | "planning"
  | "tool_call"
  | "tool_result"
  | "artifact"
  | "message"
  | "verification"
  | "error"
  // Demande d'information utilisateur puis réponse reçue : la timeline
  // distingue explicitement l'attente, la réponse et la reprise.
  | "user_input_request"
  | "user_input_answer"
  // Attente d'approbation : l'étape porte la décision réellement appliquée
  // (accordée, refusée ou devenue caduque).
  | "approval_request";

export type AgentStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type AgentAutonomy = "careful" | "standard" | "high";

export const AGENT_AUTONOMY_LEVELS: AgentAutonomy[] = [
  "careful",
  "standard",
  "high",
];

export function isAgentAutonomy(value: unknown): value is AgentAutonomy {
  return (
    typeof value === "string" &&
    (AGENT_AUTONOMY_LEVELS as readonly string[]).includes(value)
  );
}

// Autonomie ≠ réflexion. La réflexion règle la profondeur de raisonnement du
// modèle ; l'autonomie règle la liberté laissée à Agent dans l'usage des outils.
export const AGENT_AUTONOMY_LABELS: Record<AgentAutonomy, string> = {
  careful: "Prudente",
  high: "Élevée",
  standard: "Standard",
};

export const AGENT_AUTONOMY_DESCRIPTIONS: Record<AgentAutonomy, string> = {
  careful: "Agent demande confirmation avant presque chaque action.",
  high: "Agent agit seul sur les opérations non sensibles et ne demande que pour l'irréversible.",
  standard:
    "Agent lit et cherche automatiquement, mais demande pour modifier, envoyer ou supprimer.",
};

// Permission d'un outil, indépendante de l'autonomie : l'autonomie fixe les
// valeurs par défaut, l'utilisateur peut surcharger outil par outil.
export type ToolPermission = "auto" | "ask" | "off";

export const TOOL_PERMISSIONS: ToolPermission[] = ["auto", "ask", "off"];

export function isToolPermission(value: unknown): value is ToolPermission {
  return (
    typeof value === "string" &&
    (TOOL_PERMISSIONS as readonly string[]).includes(value)
  );
}

export type ToolCategory =
  | "web"
  | "files"
  | "library"
  | "project"
  | "internal"
  | "artifact"
  | "plugins"
  | "mcp"
  | "skills";

export type AgentToolSource =
  | "internal"
  | "existing"
  | "plugin"
  | "mcp"
  | "skill";

export type AgentToolPermissions = {
  default: ToolPermission;
  destructive?: boolean;
  impact?: "read" | "local_creation" | "external_mutation" | "deletion";
  readOnly?: boolean;
};

export type AgentToolAvailability = {
  categories: ToolCategory[];
  requires?: {
    files?: boolean;
    reasoning?: boolean;
    tools?: boolean;
  };
  tiers?: "all" | string[];
};

export type AgentSourceKind =
  | "web"
  | "file"
  | "library"
  | "project"
  | "plugin"
  | "mcp";

export type AgentSource = {
  fileId?: string;
  id: string;
  kind: AgentSourceKind;
  metadata?: Record<string, unknown>;
  title: string;
  toolId?: string;
  url?: string;
};

// Effets génériques déclarés par un outil : le runtime et la timeline les
// exploitent sans jamais connaître le nom de l'outil (aucune branche dédiée).
export type ToolArtifactRef = {
  documentId: string;
  kind: string;
  title: string;
};

export type ToolAwaitingUserRef = {
  expiresAt: string;
  requestId: string;
};

export type ToolOutcome = {
  artifact?: ToolArtifactRef;
  awaitingUser?: ToolAwaitingUserRef;
  // Plan de tâche structuré, déclaré par un outil (tasks) : le contrôleur le
  // persiste sur le run et le diffuse à la timeline. Effet générique : aucune
  // couche ne connaît le nom de l'outil qui l'a produit.
  plan?: AgentPlan;
};

export type ToolSuccess = {
  data: unknown;
  outcome?: ToolOutcome;
  sources?: AgentSource[];
  success: true;
};

type ToolFailureDetail = {
  category?: ToolErrorCategory;
  retryAfterMs?: number;
  retryable?: boolean;
};

export type ToolFailure = {
  error: {
    code: string;
    message: string;
  } & ToolFailureDetail;
  success: false;
};

export type ToolResult = ToolSuccess | ToolFailure;

export function toolSuccess(
  data: unknown,
  sources?: AgentSource[],
  outcome?: ToolOutcome
): ToolSuccess {
  return {
    data,
    ...(outcome ? { outcome } : {}),
    ...(sources && sources.length > 0 ? { sources } : {}),
    success: true,
  };
}

// Erreur normalisée : seuls `code`, `message`, `category`, `retryable` et
// `retryAfterMs` franchissent la frontière (vers le modèle et l'interface).
// Les détails internes restent côté serveur (voir AgentToolError).
export function toolFailure(
  code: string,
  message: string,
  detail: ToolFailureDetail = {}
): ToolFailure {
  return {
    error: {
      code,
      message: message.slice(0, 400),
      ...(detail.category === undefined ? {} : { category: detail.category }),
      ...(detail.retryAfterMs === undefined
        ? {}
        : { retryAfterMs: detail.retryAfterMs }),
      ...(detail.retryable === undefined
        ? {}
        : { retryable: detail.retryable }),
    },
    success: false,
  };
}

export function unwrapAgentToolOutput(output: unknown): unknown {
  if (!output || typeof output !== "object") return output;
  const value = output as {
    data?: unknown;
    error?: { message?: unknown };
    success?: unknown;
  };
  if (value.success === true && "data" in value) return value.data;
  if (value.success === false && value.error) {
    return {
      error:
        typeof value.error.message === "string"
          ? value.error.message
          : "Erreur de l'outil.",
    };
  }
  return output;
}

export function isToolSuccess(result: ToolResult): result is ToolSuccess {
  return result.success;
}

// Contexte d'exécution d'un outil : tout ce dont une fonction serveur a besoin
// pour travailler sans dépendre du runtime ni du flux.
export type ToolExecutionContext = {
  agentId?: string | null;
  chatId: string;
  projectId: string | null;
  runId: string;
  sessionToken: string;
  signal?: AbortSignal;
  stepId: string;
  // Identifiant de l'appel d'outil côté fournisseur : clé stable pour
  // rattacher une approbation ou une réponse utilisateur au tool call exact.
  toolCallId: string;
  toolExecutionId: string;
  tier?: string;
  userEmail: string;
  userId: string;
};

// Base de contexte connue dès l'ouverture du run ; les identifiants de step et
// d'exécution d'outil sont créés au moment de chaque appel (voir
// ToolCallController), puisque un step n'existe qu'une fois l'outil demandé.
export type AgentToolBaseContext = {
  agentId?: string | null;
  chatId: string;
  projectId: string | null;
  sessionToken: string;
  signal?: AbortSignal;
  tier?: string;
  userEmail: string;
  userId: string;
};

// Contrat entre le runtime (qui persiste et diffuse) et l'adaptateur provider
// (qui exécute). Le contrôleur matérialise chaque appel : step, ligne
// ToolExecution, permissions, retries bornés, événements. Le provider ne fait
// qu'appeler `runToolCall` et exposer la prédication d'approbation.
export type ToolCallController = {
  // Appelée par le SDK avant toute exécution (needsApproval) : crée ou relit une
  // ApprovalRequest persistante et décide s'il faut suspendre le run.
  onApprovalRequired: (params: {
    input: unknown;
    toolId: string;
    toolCallId: string;
  }) => Promise<boolean>;
  runToolCall: (params: {
    execute: (context: ToolExecutionContext) => Promise<ToolResult>;
    input: unknown;
    tool: RegisteredAgentTool;
    toolCallId: string;
  }) => Promise<ToolResult>;
};

export type AgentToolDefinition<Input> = {
  availability: AgentToolAvailability;
  category: ToolCategory;
  description: string;
  execute: (
    input: Input,
    context: ToolExecutionContext
  ) => Promise<ToolResult> | ToolResult;
  id: string;
  name: string;
  permissions: AgentToolPermissions;
  schema: ZodType<Input>;
  source?: AgentToolSource;
  // Résumé humain affiché dans la timeline. Déclaré par l'outil lui-même :
  // aucune couche générique n'a besoin de connaître son identifiant.
  summarize?: (data: unknown) => string;
};

export type AgentTool<Input = unknown> = AgentToolDefinition<Input> & {
  source: AgentToolSource;
};

// Vue effacée d'un outil, telle que stockée par le registre. `execute` reçoit
// une entrée déjà validée par `schema` : le registre ne connaît pas le type
// précis de chaque outil, c'est le rôle de zod au moment de l'appel.
export type RegisteredAgentTool = Omit<
  AgentTool<never>,
  "execute" | "schema"
> & {
  execute: (
    input: unknown,
    context: ToolExecutionContext
  ) => Promise<ToolResult>;
  schema: ZodType<unknown>;
};

export type AgentExecutionBudget = {
  // Plafond TECHNIQUE d'une invocation (tous forfaits).
  maxDurationMs: number;
  maxRetries: number;
  maxSteps: number;
  maxToolCalls: number;
  // Limite PRODUIT cumulée du run (Plus 1 h, Pro 3 h, Max null = aucune).
  // Appliquée sur le temps d'activité checkpointé, pas sur une invocation.
  productLimitMs?: number | null;
};

export type AgentPlanItem = {
  id: string;
  label: string;
  status: AgentStepStatus;
};

export type AgentPlan = {
  items: AgentPlanItem[];
  summary?: string;
  title: string;
};

// États sérialisables diffusés au client via les data parts du flux AI SDK.
export type AgentRunEvent = {
  model: string;
  reasoningLevel: ReasoningLevel;
  runId: string;
  status: AgentRunStatus;
  stepCount?: number;
  toolCallCount?: number;
  // Synthèse d'observabilité utilisateur : renseignée en fin de run (flux) et
  // à la reconstruction après refresh (API). Distincte des traces techniques.
  durationMs?: number;
  error?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AgentStepEvent = {
  index: number;
  runId: string;
  status: AgentStepStatus;
  stepId: string;
  summary?: string;
  title: string;
  type: AgentStepType;
};

export type AgentToolActivity = {
  // Tentative : > 1 quand l'exécution a fait l'objet d'un retry persisté.
  attempt?: number;
  category: ToolCategory;
  // Catégorie d'erreur normalisée (rate_limit, timeout, network, provider).
  errorCategory?: string | null;
  durationMs?: number;
  label: string;
  runId: string;
  status: "running" | "completed" | "failed" | "waiting_approval";
  stepId: string;
  summary?: string;
  toolId: string;
};

export type AgentArtifactRef = {
  documentId: string;
  kind: string;
  runId: string;
  title: string;
};

export type AgentSettings = {
  autonomy: AgentAutonomy;
  defaultModel: string | null;
  defaultProjectId: string | null;
  enabledCategories: ToolCategory[] | null;
  reasoningLevel: ReasoningLevel;
  toolPolicies: Record<string, ToolPermission>;
  updatedAt?: Date | null;
};

export const AGENT_SETTINGS_DEFAULTS: AgentSettings = {
  autonomy: "standard",
  defaultModel: null,
  defaultProjectId: null,
  enabledCategories: null,
  reasoningLevel: "medium",
  toolPolicies: {},
};

export type AgentRunUsage = {
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AgentRunRecord = {
  autonomy: AgentAutonomy;
  budget: AgentExecutionBudget;
  chatId: string;
  completedAt: Date | null;
  error: string | null;
  id: string;
  model: string;
  plan: AgentPlan | null;
  reasoningLevel: ReasoningLevel;
  startedAt: Date | null;
  status: AgentRunStatus;
  stepCount: number;
  toolCallCount: number;
  userId: string;
};

export type AgentStepRecord = {
  completedAt: Date | null;
  createdAt: Date;
  id: string;
  index: number;
  runId: string;
  status: AgentStepStatus;
  summary: string | null;
  title: string;
  toolExecutionId: string | null;
  type: AgentStepType;
};

export type ToolExecutionRecord = {
  approvalStatus: string;
  // Chaque tentative est une ligne : regroupement UI par stepId (parent).
  attempt: number;
  category: ToolCategory;
  completedAt: Date | null;
  durationMs: number | null;
  error: string | null;
  errorCategory: string | null;
  id: string;
  input: unknown;
  output: unknown;
  parentExecutionId: string | null;
  retryable: boolean;
  runId: string;
  startedAt: Date | null;
  status: string;
  stepId: string | null;
  toolId: string;
};
