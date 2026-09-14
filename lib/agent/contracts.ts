import { z } from "zod";

// Contrats structurés des intentions Agent. Toute sortie du modèle (ou du
// client) passe par l'un de ces schémas avant d'être autorisée, persistée ou
// exécutée : une sortie invalide ne devient jamais une opération exécutable.
// Aucune détection par mots-clés ni commande textuelle : le backend reçoit des
// structures, les valide, puis décide.

// ---------------------------------------------------------------------------
// Run immédiat
// ---------------------------------------------------------------------------

export const runIntentSchema = z.object({
  autonomy: z.enum(["careful", "standard", "high"]).optional(),
  enabledCategories: z
    .array(z.string().max(40))
    .max(12)
    .nullable()
    .default(null),
  kind: z.literal("run"),
  modelId: z.string().min(1).max(200),
  projectId: z.string().uuid().nullable().default(null),
  reasoningLevel: z.enum(["low", "medium", "high"]).optional(),
  task: z.string().min(1).max(8000),
});

export type RunIntent = z.infer<typeof runIntentSchema>;

// ---------------------------------------------------------------------------
// Tâche planifiée
// ---------------------------------------------------------------------------

export const SCHEDULE_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export const SCHEDULE_WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type ScheduleWeekday = (typeof SCHEDULE_WEEKDAYS)[number];

export const scheduleWeekdaySchema = z.enum(SCHEDULE_WEEKDAYS);

const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Heure locale attendue (HH:mm)");

// Règle de récurrence exprimée en heure LOCALE du fuseau du schedule — jamais
// en UTC : les changements d'heure (DST) sont recalculés depuis la règle et le
// fuseau IANA, pas depuis une suite de dates UTC ambiguës.
const recurringBase = z.object({
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  frequency: z.enum(SCHEDULE_FREQUENCIES),
  kind: z.literal("recurring"),
  time: localTimeSchema,
  weekday: scheduleWeekdaySchema.optional(),
});

// Champ de règle cohérent avec la fréquence : weekday n'a de sens que pour
// weekly, dayOfMonth que pour monthly — une règle ambiguë est rejetée plutôt
// qu'interprétée.
export const scheduleRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("once") }),
  recurringBase
    .refine(
      (rule) => rule.frequency !== "daily" || rule.weekday === undefined,
      { message: "weekday ne s'applique qu'à une récurrence hebdomadaire." }
    )
    .refine(
      (rule) => rule.frequency === "monthly" || rule.dayOfMonth === undefined,
      { message: "dayOfMonth ne s'applique qu'à une récurrence mensuelle." }
    )
    .refine(
      (rule) => rule.frequency !== "weekly" || rule.weekday !== undefined,
      { message: "Une récurrence hebdomadaire exige un jour de semaine." }
    ),
]);

export type ScheduleRule = z.infer<typeof scheduleRuleSchema>;

// Fuseau IANA : une liste fixe est plus sûre qu'une regex (les identifiants
// sont contrôlés à la création ; Intl.DateTimeFormat valide à l'exécution).
export const scheduleTimezoneSchema = z
  .string()
  .min(3)
  .max(64)
  .refine(
    (value) => isValidIanaTimezone(value),
    "Fuseau horaire IANA invalide (ex. Europe/Paris)"
  );

export function isValidIanaTimezone(value: string): boolean {
  try {
    // La construction seul(e) suffit : Intl.DateTimeFormat lève une RangeError
    // si l'identifiant n'est pas un fuseau IANA reconnu.
    void new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const scheduleIntentSchema = z.object({
  agentId: z.string().uuid().nullable().default(null),
  autonomy: z.enum(["careful", "standard", "high"]).default("standard"),
  enabledCategories: z
    .array(z.string().max(40))
    .max(12)
    .nullable()
    .default(null),
  instructions: z.string().min(1).max(8000),
  kind: z.literal("schedule"),
  modelId: z.string().min(1).max(200),
  projectId: z.string().uuid().nullable().default(null),
  reasoningLevel: z.enum(["low", "medium", "high"]).default("medium"),
  rule: scheduleRuleSchema,
  timezone: scheduleTimezoneSchema,
  title: z.string().min(1).max(120),
});

export type ScheduleIntent = z.infer<typeof scheduleIntentSchema>;

// Mutation d'un schedule existant : protégée par révision optimiste pour
// éviter qu'une édition ne perde une suspension ou une suppression logique.
export const scheduleMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("resume") }),
  z.object({
    action: z.literal("update"),
    patch: z
      .object({
        autonomy: z.enum(["careful", "standard", "high"]).optional(),
        enabledCategories: z
          .array(z.string().max(40))
          .max(12)
          .nullable()
          .optional(),
        instructions: z.string().min(1).max(8000).optional(),
        modelId: z.string().min(1).max(200).optional(),
        projectId: z.string().uuid().nullable().optional(),
        reasoningLevel: z.enum(["low", "medium", "high"]).optional(),
        rule: scheduleRuleSchema.optional(),
        timezone: scheduleTimezoneSchema.optional(),
        title: z.string().min(1).max(120).optional(),
      })
      .refine((patch) => Object.keys(patch).length > 0, {
        message: "Aucune modification fournie.",
      }),
  }),
  z.object({ action: z.literal("delete") }),
]);

export type ScheduleMutation = z.infer<typeof scheduleMutationSchema>;

// ---------------------------------------------------------------------------
// Réorientation d'un run en cours
// ---------------------------------------------------------------------------

// Toute intervention utilisateur pendant un run est interprétée par le modèle
// en une instruction structurée, validée puis mise en file ordonnée.
export const reorientationInstructionSchema = z.object({
  stopRequested: z.boolean().default(false),
  text: z.string().min(1).max(4000),
});

export type ReorientationInstruction = z.infer<
  typeof reorientationInstructionSchema
>;

// ---------------------------------------------------------------------------
// Décision d'approbation
// ---------------------------------------------------------------------------

export const approvalDecisionSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve") }),
  z.object({ decision: z.literal("deny"), reason: z.string().max(400) }),
]);

export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

// ---------------------------------------------------------------------------
// Sélection d'outils structurée (sortie du modèle)
// ---------------------------------------------------------------------------

// Le modèle ne choisit jamais un outil précis : il choisit des familles, qui
// sont ensuite intersectées avec les outils réellement disponibles (modèle,
// forfait, filtres utilisateur). Sortie validée ; fallback déterministe si
// invalide.
export const toolSelectionOutputSchema = z.object({
  families: z.array(z.string().min(1).max(40)).min(0).max(6),
  reasoning: z.string().max(200).optional(),
});

export type ToolSelectionOutput = z.infer<typeof toolSelectionOutputSchema>;

// ---------------------------------------------------------------------------
// SuggestedActions proposées par le modèle en fin de run
// ---------------------------------------------------------------------------

export const suggestedActionProposalSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type SuggestedActionProposal = z.infer<
  typeof suggestedActionProposalSchema
>;

export const suggestedActionProposalsSchema = z.object({
  actions: z.array(suggestedActionProposalSchema).max(3),
});

export type SuggestedActionProposals = z.infer<
  typeof suggestedActionProposalsSchema
>;
