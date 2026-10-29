import "server-only";

import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import { invalidateMaiUserCache } from "@/lib/auth/session";
import { dbReady, getDb } from "@/lib/db/queries";
import { userForm, userFormResponse } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { buildActiveFormsFilter } from "@/lib/forms/query-filters";
import {
  type FormQuestion,
  getFormRewardTypes,
  type RewardType,
  type UserFormDetail,
} from "./types";
import { validateFormAnswers } from "./validation";

/**
 * Calcule le début de la semaine courante (lundi 00:00 UTC)
 * pour cibler exactement les tables d'usage hebdomadaire (weekly_usage, weekly_speech_usage).
 */
export function getWeekData() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - (day - 1));
  weekStart.setUTCHours(0, 0, 0, 0);
  const nextReset = new Date(weekStart);
  nextReset.setUTCDate(weekStart.getUTCDate() + 7);
  return {
    nextResetIso: nextReset.toISOString(),
    weekStartStr: weekStart.toISOString().split("T")[0],
  };
}

/**
 * Récupère tous les formulaires actifs et actuellement ouverts pour un utilisateur.
 * Indique si l'utilisateur y a déjà répondu et quelle récompense il a obtenue.
 */
export async function getActiveForms(
  userId: string
): Promise<UserFormDetail[]> {
  await dbReady();
  const db = getDb();
  const now = new Date();

  const forms = await db
    .select()
    .from(userForm)
    .where(buildActiveFormsFilter(now))
    .orderBy(desc(userForm.createdAt));

  if (forms.length === 0) {
    return [];
  }

  // Récupération des réponses existantes de cet utilisateur
  const userResponses = await db
    .select()
    .from(userFormResponse)
    .where(eq(userFormResponse.userId, userId));

  const responseMap = new Map(userResponses.map((r) => [r.formId, r]));

  return forms.map((f) => {
    const existing = responseMap.get(f.id);
    return {
      description: f.description || "",
      endDate: f.endDate ? f.endDate.toISOString() : null,
      hasSubmitted: Boolean(existing),
      id: f.id,
      isActive: f.isActive,
      name: f.name,
      options: (f.options as Record<string, unknown>) || {},
      questions: (f.questions as FormQuestion[]) || [],
      startDate: f.startDate.toISOString(),
      submittedAt: existing?.createdAt
        ? existing.createdAt.toISOString()
        : null,
      submittedReward: (existing?.rewardType as RewardType) || null,
    };
  });
}

/**
 * Récupère le détail d'un formulaire spécifique pour l'affichage.
 */
export async function getFormById(
  formId: string,
  userId: string
): Promise<UserFormDetail | null> {
  await dbReady();
  const db = getDb();

  const rows = await db
    .select()
    .from(userForm)
    .where(eq(userForm.id, formId))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const f = rows[0];

  const userResponses = await db
    .select()
    .from(userFormResponse)
    .where(
      and(
        eq(userFormResponse.formId, formId),
        eq(userFormResponse.userId, userId)
      )
    )
    .limit(1);

  const existing = userResponses[0];

  return {
    description: f.description || "",
    endDate: f.endDate ? f.endDate.toISOString() : null,
    hasSubmitted: Boolean(existing),
    id: f.id,
    isActive: f.isActive,
    name: f.name,
    options: (f.options as Record<string, unknown>) || {},
    questions: (f.questions as FormQuestion[]) || [],
    startDate: f.startDate.toISOString(),
    submittedAt: existing?.createdAt ? existing.createdAt.toISOString() : null,
    submittedReward: (existing?.rewardType as RewardType) || null,
  };
}

/**
 * Exécuteur SQL minimal : la transaction Drizzle de la soumission, ou une
 * connexion directe pour un usage hors transaction. Aucune erreur SQL n'est
 * absorbée : une récompense non appliquée doit faire échouer la soumission.
 */
export type FormRewardExecutor = {
  execute: (query: SQL) => Promise<unknown>;
};

/**
 * Applique la réinitialisation immédiate du compteur d'utilisation pour le type de quota choisi.
 *
 * Toutes les identités historiques (id, email, username) sont couvertes par
 * des sous-requêtes paramétrées ; une panne SQL remonte à l'appelant.
 */
export async function applyQuotaReset(
  userId: string,
  rewardType: RewardType,
  executor: FormRewardExecutor
): Promise<{ success: true; details: string }> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    throw new ChatbotError(
      "bad_request:api",
      "Identifiant utilisateur manquant pour appliquer la récompense."
    );
  }
  const { weekStartStr } = getWeekData();

  switch (rewardType) {
    case "mai": {
      await executor.execute(sql`
        UPDATE weekly_usage SET tokens_used = 0
        WHERE user_id IN (
          SELECT id FROM users
          WHERE id::text = ${trimmedUserId}
             OR email = ${trimmedUserId}
             OR username = ${trimmedUserId}
        )
          AND week_start = ${weekStartStr}::date
      `);
      return {
        details: "Compteur de tokens hebdomadaires mAI remis à 0.",
        success: true,
      };
    }

    case "api": {
      await executor.execute(sql`
        UPDATE mprojects_api_keys SET request_count = 0
        WHERE user_id = ${trimmedUserId}
           OR user_id IN (
             SELECT id::text FROM users
             WHERE id::text = ${trimmedUserId}
                OR email = ${trimmedUserId}
                OR username = ${trimmedUserId}
           )
           OR user_id IN (
             SELECT email FROM users
             WHERE id::text = ${trimmedUserId}
                OR email = ${trimmedUserId}
                OR username = ${trimmedUserId}
           )
           OR user_id IN (
             SELECT username FROM users
             WHERE id::text = ${trimmedUserId}
                OR email = ${trimmedUserId}
                OR username = ${trimmedUserId}
           )
      `);
      return {
        details: "Compteur de requêtes API du compte remis à 0.",
        success: true,
      };
    }

    case "images": {
      await executor.execute(sql`
        UPDATE mprojects_daily_image_usage SET images_generated = 0
        WHERE usage_date = CURRENT_DATE
          AND (
            user_id = ${trimmedUserId}
            OR user_id IN (
              SELECT id::text FROM users
              WHERE id::text = ${trimmedUserId}
                 OR email = ${trimmedUserId}
                 OR username = ${trimmedUserId}
            )
            OR user_id IN (
              SELECT email FROM users
              WHERE id::text = ${trimmedUserId}
                 OR email = ${trimmedUserId}
                 OR username = ${trimmedUserId}
            )
            OR user_id IN (
              SELECT username FROM users
              WHERE id::text = ${trimmedUserId}
                 OR email = ${trimmedUserId}
                 OR username = ${trimmedUserId}
            )
          )
      `);
      return {
        details: "Compteur journalier d'images remis à 0.",
        success: true,
      };
    }

    case "audio": {
      await executor.execute(sql`
        UPDATE weekly_speech_usage
        SET tokens_used = 0, requests_count = 0
        WHERE week_start = ${weekStartStr}::date
          AND (
            user_id = ${trimmedUserId}
            OR user_id IN (
              SELECT id::text FROM users
              WHERE id::text = ${trimmedUserId}
                 OR email = ${trimmedUserId}
                 OR username = ${trimmedUserId}
            )
            OR user_id IN (
              SELECT email FROM users
              WHERE id::text = ${trimmedUserId}
                 OR email = ${trimmedUserId}
                 OR username = ${trimmedUserId}
            )
            OR user_id IN (
              SELECT username FROM users
              WHERE id::text = ${trimmedUserId}
                 OR email = ${trimmedUserId}
                 OR username = ${trimmedUserId}
            )
          )
      `);
      return {
        details: "Compteur hebdomadaire audio remis à 0.",
        success: true,
      };
    }

    default:
      throw new ChatbotError(
        "bad_request:api",
        `Type de récompense inconnu: ${rewardType}`
      );
  }
}

/**
 * Enregistre les réponses de l'utilisateur à un formulaire et lui applique sa réinitialisation de limites.
 */
export async function submitFormResponse(params: {
  answers: Record<string, unknown>;
  formId: string;
  rewardType: RewardType;
  sessionToken?: string | null;
  userId: string;
}): Promise<{
  details: string;
  rewardType: RewardType;
  success: boolean;
}> {
  await dbReady();
  const db = getDb();
  const { formId, rewardType, sessionToken, userId } = params;

  // 1. Vérifier l'existence et la validité du formulaire
  const formRows = await db
    .select()
    .from(userForm)
    .where(eq(userForm.id, formId))
    .limit(1);

  if (formRows.length === 0) {
    throw new ChatbotError("not_found:database", "Formulaire introuvable.");
  }

  const f = formRows[0];
  if (!f.isActive) {
    throw new ChatbotError(
      "bad_request:api",
      "Ce formulaire n'est plus actif."
    );
  }

  const now = new Date();
  if (f.startDate > now) {
    throw new ChatbotError(
      "bad_request:api",
      "Ce formulaire n'a pas encore débuté."
    );
  }
  if (f.endDate && f.endDate < now) {
    throw new ChatbotError("bad_request:api", "Ce formulaire est expiré.");
  }
  if (
    !getFormRewardTypes((f.options as Record<string, unknown>) || {}).includes(
      rewardType
    )
  ) {
    throw new ChatbotError(
      "bad_request:api",
      "Cette récompense n'est pas proposée pour ce formulaire."
    );
  }

  // 2. Valider les réponses contre les questions ENREGISTRÉES
  const validated = validateFormAnswers(
    (f.questions as FormQuestion[]) || [],
    params.answers
  );
  if (!validated.ok) {
    throw new ChatbotError("bad_request:api", validated.error);
  }

  // 3. Réponse + récompense dans LA MÊME transaction : si la remise à zéro
  // échoue, la réponse n'est pas enregistrée (donc pas de blocage « déjà
  // répondu ») et la récompense n'est jamais annoncée à tort. Les deux
  // indicateurs ne passent à vrai qu'après l'application réelle.
  let resetResult: { success: true; details: string };
  try {
    resetResult = await db.transaction(async (tx) => {
      const existingRows = await tx
        .select({ id: userFormResponse.id })
        .from(userFormResponse)
        .where(
          and(
            eq(userFormResponse.formId, formId),
            eq(userFormResponse.userId, userId)
          )
        )
        .limit(1);
      if (existingRows.length > 0) {
        throw new ChatbotError(
          "bad_request:api",
          "Vous avez déjà répondu à ce formulaire."
        );
      }

      const [inserted] = await tx
        .insert(userFormResponse)
        .values({
          answers: validated.value,
          formId,
          rewardAppliedAt: null,
          rewardResetApplied: false,
          rewardType,
          userId,
        })
        .returning({ id: userFormResponse.id });

      if (!inserted) {
        throw new ChatbotError(
          "bad_request:database",
          "La réponse n'a pas pu être enregistrée."
        );
      }

      const applied = await applyQuotaReset(
        userId,
        rewardType,
        tx as unknown as FormRewardExecutor
      );

      await tx
        .update(userFormResponse)
        .set({ rewardAppliedAt: new Date(), rewardResetApplied: true })
        .where(eq(userFormResponse.id, inserted.id));

      return applied;
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
    // Violation de l'index unique : une soumission concurrente a gagné.
    const code =
      (error as { code?: unknown })?.code ??
      (error as { cause?: { code?: unknown } })?.cause?.code;
    if (code === "23505") {
      throw new ChatbotError(
        "bad_request:api",
        "Vous avez déjà répondu à ce formulaire."
      );
    }
    throw error;
  }

  // 4. Invalider le cache de session en mémoire si sessionToken fourni
  if (sessionToken) {
    invalidateMaiUserCache(sessionToken);
  }

  return {
    details: resetResult.details,
    rewardType,
    success: true,
  };
}
