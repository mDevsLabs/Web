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
// Clarification interactive (questionnaire à l'utilisateur)
// ---------------------------------------------------------------------------

// Le modèle produit un contrat STRUCTURÉ ; le serveur le valide strictement.
// Aucune interprétation par mots-clés : un questionnaire incohérent est refusé
// (et renvoyé au modèle comme argument invalide à corriger), jamais deviné.

export const ASK_USER_QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "text",
  "slider",
  "boolean",
  "date",
] as const;

export type AskUserQuestionType = (typeof ASK_USER_QUESTION_TYPES)[number];

export const ASK_USER_MAX_QUESTIONS = 6;
export const ASK_USER_MAX_OPTIONS = 12;
export const ASK_USER_MAX_PAYLOAD_CHARS = 12_000;
export const ASK_USER_TEXT_MAX = 300;

const CHOICE_QUESTION_TYPES: readonly AskUserQuestionType[] = [
  "multiple_choice",
  "single_choice",
];

// Identifiant stable, exploité comme clé de réponse : un identifiant dupliqué
// rendrait la réponse ambiguë, il est donc refusé par le schéma.
const questionIdSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(
    /^[A-Za-z][A-Za-z0-9_-]*$/,
    "Identifiant attendu : lettres, chiffres, « _ » ou « - », commençant par une lettre."
  );

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide");

const answerValueSchema = z.union([
  z.string().max(ASK_USER_TEXT_MAX),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(120)).max(ASK_USER_MAX_OPTIONS),
]);

export type UserInputAnswerValue = z.infer<typeof answerValueSchema>;

const defaultValueSchema = answerValueSchema.optional();

export const askUserQuestionSchema = z
  .object({
    allowCustomInput: z
      .boolean()
      .default(false)
      .describe(
        "Autorise une saisie libre en plus des choix proposés (types à choix uniquement)."
      ),
    defaultValue: defaultValueSchema.describe("Valeur pré-sélectionnée"),
    help: z
      .string()
      .max(200)
      .optional()
      .describe("Précision courte affichée sous la question"),
    id: questionIdSchema.describe(
      "Identifiant stable de la question (ex. budget)"
    ),
    max: z.number().finite().optional().describe("Borne haute (slider)"),
    min: z.number().finite().optional().describe("Borne basse (slider)"),
    options: z
      .array(z.string().min(1).max(120))
      .min(2)
      .max(ASK_USER_MAX_OPTIONS)
      .optional()
      .describe("Choix proposés (obligatoire pour les types à choix)"),
    question: z.string().min(1).max(300).describe("Question claire et précise"),
    required: z.boolean().default(true),
    step: z.number().positive().finite().optional().describe("Pas du curseur"),
    type: z.enum(ASK_USER_QUESTION_TYPES).default("single_choice"),
  })
  .superRefine((question, ctx) => {
    const isChoice = CHOICE_QUESTION_TYPES.includes(question.type);

    if (isChoice) {
      if (!question.options || question.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Deux choix au minimum sont nécessaires pour ce type.",
          path: ["options"],
        });
      } else {
        const normalized = question.options.map((option) =>
          option.trim().toLowerCase()
        );
        if (new Set(normalized).size !== normalized.length) {
          ctx.addIssue({
            code: "custom",
            message: "Les choix proposés doivent être distincts.",
            path: ["options"],
          });
        }
        if (question.options.some((option) => !option.trim())) {
          ctx.addIssue({
            code: "custom",
            message: "Un choix vide n'est pas exploitable.",
            path: ["options"],
          });
        }
      }
    } else {
      if (question.options) {
        ctx.addIssue({
          code: "custom",
          message: "Ce type n'accepte pas de liste de choix.",
          path: ["options"],
        });
      }
      if (question.allowCustomInput) {
        ctx.addIssue({
          code: "custom",
          message: "La saisie libre ne s'applique qu'aux questions à choix.",
          path: ["allowCustomInput"],
        });
      }
      // Les bornes et le pas n'ont de sens que pour un curseur : les accepter
      // ailleurs laisserait croire à une contrainte qui ne serait jamais
      // appliquée.
      if (
        question.type !== "slider" &&
        (question.min !== undefined ||
          question.max !== undefined ||
          question.step !== undefined)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Les bornes ne s'appliquent qu'au type curseur (slider).",
          path: ["min"],
        });
      }
    }

    if (question.type === "slider") {
      if (question.min === undefined || question.max === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "Un curseur exige une borne basse et une borne haute.",
          path: ["min"],
        });
      } else if (question.min >= question.max) {
        ctx.addIssue({
          code: "custom",
          message: "La borne basse doit être strictement inférieure.",
          path: ["min"],
        });
      } else if (
        question.step !== undefined &&
        question.step > question.max - question.min
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Le pas dépasse l'amplitude du curseur.",
          path: ["step"],
        });
      }
    }

    if (question.defaultValue === undefined) {
      return;
    }

    const value = question.defaultValue;
    const isNumber =
      typeof value === "number" && Number.isFinite(value as number);

    if (question.type === "boolean" && typeof value !== "boolean") {
      ctx.addIssue({
        code: "custom",
        message: "Valeur par défaut attendue : oui ou non.",
        path: ["defaultValue"],
      });
      return;
    }

    if (question.type === "slider") {
      if (!isNumber) {
        ctx.addIssue({
          code: "custom",
          message: "Valeur par défaut attendue : nombre.",
          path: ["defaultValue"],
        });
      } else if (
        question.min !== undefined &&
        question.max !== undefined &&
        ((value as number) < question.min || (value as number) > question.max)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Valeur par défaut hors des bornes du curseur.",
          path: ["defaultValue"],
        });
      }
      return;
    }

    if (question.type === "date") {
      if (
        typeof value !== "string" ||
        !isoDateSchema.safeParse(value).success
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Valeur par défaut attendue : date AAAA-MM-JJ.",
          path: ["defaultValue"],
        });
      }
      return;
    }

    if (question.type === "multiple_choice") {
      if (!Array.isArray(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Valeur par défaut attendue : liste de choix.",
          path: ["defaultValue"],
        });
        return;
      }
      const allowed = new Set(
        (question.options ?? []).map((option) => option.trim().toLowerCase())
      );
      const invalid = value.some(
        (item) => !allowed.has(String(item).trim().toLowerCase())
      );
      if (invalid) {
        ctx.addIssue({
          code: "custom",
          message: "La valeur par défaut doit appartenir aux choix proposés.",
          path: ["defaultValue"],
        });
      }
      return;
    }

    if (question.type === "single_choice") {
      if (typeof value !== "string") {
        ctx.addIssue({
          code: "custom",
          message: "Valeur par défaut attendue : un des choix proposés.",
          path: ["defaultValue"],
        });
        return;
      }
      const allowed = new Set(
        (question.options ?? []).map((option) => option.trim().toLowerCase())
      );
      if (!allowed.has(value.trim().toLowerCase())) {
        ctx.addIssue({
          code: "custom",
          message: "La valeur par défaut doit appartenir aux choix proposés.",
          path: ["defaultValue"],
        });
      }
    }
  });

export type AskUserQuestion = z.infer<typeof askUserQuestionSchema>;

// Questionnaire complet : de 1 à 6 questions, identifiants uniques, et au moins
// une question réellement obligatoire — un questionnaire entièrement facultatif
// n'a pas de raison d'interrompre l'utilisateur.
export const askUserRequestSchema = z
  .object({
    description: z
      .string()
      .max(600)
      .optional()
      .describe("Contexte court expliquant pourquoi ces questions sont posées"),
    questions: z
      .array(askUserQuestionSchema)
      .min(1)
      .max(ASK_USER_MAX_QUESTIONS),
    title: z.string().min(1).max(120),
  })
  .superRefine((request, ctx) => {
    const ids = request.questions.map((question) => question.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Chaque question doit porter un identifiant unique.",
        path: ["questions"],
      });
    }
    if (!request.questions.some((question) => question.required)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Au moins une question doit être obligatoire : sinon aucune réponse n'est attendue.",
        path: ["questions"],
      });
    }
    if (JSON.stringify(request.questions).length > ASK_USER_MAX_PAYLOAD_CHARS) {
      ctx.addIssue({
        code: "custom",
        message: "Questionnaire trop volumineux.",
        path: ["questions"],
      });
    }
  });

export type AskUserRequest = z.infer<typeof askUserRequestSchema>;

// ---------------------------------------------------------------------------
// Réponses à un questionnaire (validées contre les questions persistées)
// ---------------------------------------------------------------------------

export const userInputAnswerSchema = z.object({
  questionId: questionIdSchema,
  value: answerValueSchema,
});

export type UserInputAnswer = z.infer<typeof userInputAnswerSchema>;

export const userInputSubmissionSchema = z.object({
  answers: z.array(userInputAnswerSchema).min(1).max(ASK_USER_MAX_QUESTIONS),
  requestId: z.uuid(),
  revision: z.number().int().min(0).max(10_000),
});

export type UserInputSubmission = z.infer<typeof userInputSubmissionSchema>;

export type UserInputAnswerRejection =
  | "duplicate_answer"
  | "empty_answer"
  | "invalid_type"
  | "missing_required"
  | "not_allowed"
  | "not_in_options"
  | "out_of_range"
  | "too_long"
  | "unknown_question";

export type UserInputAnswerValidation =
  | { answers: UserInputAnswer[]; ok: true }
  | { ok: false; questionId: string | null; reason: UserInputAnswerRejection };

function isEmptyAnswer(value: UserInputAnswerValue): boolean {
  if (typeof value === "string") {
    return !value.trim();
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function optionAllowed(question: AskUserQuestion, value: string): boolean {
  return (question.options ?? []).some(
    (option) => option.trim().toLowerCase() === value.trim().toLowerCase()
  );
}

// Validation des réponses contre les QUESTIONS PERSISTÉES : c'est le serveur qui
// décide, jamais le client ni un texte libre interprété. Chaque refus porte la
// question concernée et une raison exploitable.
export function validateUserInputAnswers(params: {
  answers: UserInputAnswer[];
  questions: AskUserQuestion[];
}): UserInputAnswerValidation {
  const byId = new Map(
    params.questions.map((question) => [question.id, question] as const)
  );
  const seen = new Set<string>();
  const validated: UserInputAnswer[] = [];

  for (const answer of params.answers) {
    const question = byId.get(answer.questionId);
    if (!question) {
      return {
        ok: false,
        questionId: answer.questionId,
        reason: "unknown_question",
      };
    }
    if (seen.has(answer.questionId)) {
      return {
        ok: false,
        questionId: answer.questionId,
        reason: "duplicate_answer",
      };
    }
    seen.add(answer.questionId);

    const value = answer.value;
    if (isEmptyAnswer(value)) {
      if (question.required) {
        return {
          ok: false,
          questionId: question.id,
          reason: "missing_required",
        };
      }
      continue;
    }

    switch (question.type) {
      case "boolean": {
        if (typeof value !== "boolean") {
          return { ok: false, questionId: question.id, reason: "invalid_type" };
        }
        break;
      }
      case "slider": {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return { ok: false, questionId: question.id, reason: "invalid_type" };
        }
        if (
          (question.min !== undefined && value < question.min) ||
          (question.max !== undefined && value > question.max)
        ) {
          return { ok: false, questionId: question.id, reason: "out_of_range" };
        }
        break;
      }
      case "date": {
        if (
          typeof value !== "string" ||
          !isoDateSchema.safeParse(value).success
        ) {
          return { ok: false, questionId: question.id, reason: "invalid_type" };
        }
        break;
      }
      case "text": {
        if (typeof value !== "string") {
          return { ok: false, questionId: question.id, reason: "invalid_type" };
        }
        if (value.length > ASK_USER_TEXT_MAX) {
          return { ok: false, questionId: question.id, reason: "too_long" };
        }
        break;
      }
      case "single_choice": {
        if (typeof value !== "string") {
          return { ok: false, questionId: question.id, reason: "invalid_type" };
        }
        if (!optionAllowed(question, value)) {
          if (!question.allowCustomInput) {
            return {
              ok: false,
              questionId: question.id,
              reason: "not_in_options",
            };
          }
          if (value.length > 120) {
            return { ok: false, questionId: question.id, reason: "too_long" };
          }
        }
        break;
      }
      case "multiple_choice": {
        if (!Array.isArray(value)) {
          return { ok: false, questionId: question.id, reason: "invalid_type" };
        }
        if (value.length > ASK_USER_MAX_OPTIONS) {
          return { ok: false, questionId: question.id, reason: "too_long" };
        }
        for (const item of value) {
          if (optionAllowed(question, item)) {
            continue;
          }
          if (!question.allowCustomInput) {
            return {
              ok: false,
              questionId: question.id,
              reason: "not_in_options",
            };
          }
          if (item.length > 120) {
            return { ok: false, questionId: question.id, reason: "too_long" };
          }
        }
        break;
      }
      default: {
        return { ok: false, questionId: question.id, reason: "not_allowed" };
      }
    }

    validated.push({ questionId: question.id, value });
  }

  for (const question of params.questions) {
    if (question.required && !seen.has(question.id)) {
      return { ok: false, questionId: question.id, reason: "missing_required" };
    }
  }

  return { answers: validated, ok: true };
}

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
