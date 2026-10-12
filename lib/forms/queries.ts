import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { invalidateMaiUserCache } from "@/lib/auth/session";
import { dbReady, getDb, getRawClient } from "@/lib/db/queries";
import { userForm, userFormResponse } from "@/lib/db/schema";
import { buildActiveFormsFilter } from "@/lib/forms/query-filters";
import type { FormQuestion, RewardType, UserFormDetail } from "./types";

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
 * Applique la réinitialisation immédiate du compteur d'utilisation pour le type de quota choisi.
 */
export async function applyQuotaReset(
  userId: string,
  rewardType: RewardType
): Promise<{ success: boolean; details: string }> {
  await dbReady();
  const raw = getRawClient();
  if (!raw) {
    throw new Error("Client base de données indisponible.");
  }

  const { weekStartStr } = getWeekData();
  const trimmedUserId = userId.trim();

  // Résolution de l'identifiant pour cibler à la fois les colonnes integer et text
  let resolvedIntId: number | null = null;
  const numericMatch = trimmedUserId.match(/^\d+$/);
  if (numericMatch) {
    resolvedIntId = Number.parseInt(trimmedUserId, 10);
  } else {
    try {
      const uRows = await raw.unsafe(
        "SELECT id FROM users WHERE id::text = $1 OR email = $1 OR username = $1 LIMIT 1",
        [trimmedUserId]
      );
      if (uRows.length > 0 && typeof uRows[0].id === "number") {
        resolvedIntId = uRows[0].id;
      }
    } catch {
      // Toléré si la table users locale n'est pas accessible
    }
  }

  switch (rewardType) {
    case "mai": {
      // 1. Remise à zéro des tokens chat mAI de la semaine en cours dans weekly_usage
      if (resolvedIntId !== null) {
        await raw.unsafe(
          "UPDATE weekly_usage SET tokens_used = 0 WHERE user_id = $1 AND week_start = $2::date",
          [resolvedIntId, weekStartStr]
        );
      }
      await raw
        .unsafe(
          `UPDATE weekly_usage SET tokens_used = 0
         WHERE user_id IN (SELECT id FROM users WHERE id::text = $1 OR email = $1 OR username = $1)
           AND week_start = $2::date`,
          [trimmedUserId, weekStartStr]
        )
        .catch(() => {});
      return {
        details: "Compteur de tokens hebdomadaires mAI remis à 0.",
        success: true,
      };
    }

    case "api": {
      // 2. Remise à zéro du compteur de requêtes des clés API du compte dans mprojects_api_keys
      await raw
        .unsafe(
          `UPDATE mprojects_api_keys SET request_count = 0
         WHERE user_id = $1 
            OR user_id IN (SELECT id::text FROM users WHERE id::text = $1 OR email = $1 OR username = $1)`,
          [trimmedUserId]
        )
        .catch(() => {});
      return {
        details: "Compteur de requêtes API du compte remis à 0.",
        success: true,
      };
    }

    case "images": {
      // 3. Remise à zéro des images générées ce jour dans mprojects_daily_image_usage
      await raw
        .unsafe(
          `UPDATE mprojects_daily_image_usage SET images_generated = 0
         WHERE (user_id = $1 OR user_id IN (SELECT id::text FROM users WHERE id::text = $1 OR email = $1 OR username = $1))
           AND usage_date = CURRENT_DATE`,
          [trimmedUserId]
        )
        .catch(() => {});
      return {
        details: "Compteur journalier d'images remis à 0.",
        success: true,
      };
    }

    case "audio": {
      // 4. Remise à zéro des tokens de synthèse vocale dans weekly_speech_usage
      await raw
        .unsafe(
          `UPDATE weekly_speech_usage SET tokens_used = 0, requests_count = 0
         WHERE (user_id = $1 OR user_id IN (SELECT id::text FROM users WHERE id::text = $1 OR email = $1 OR username = $1))
           AND week_start = $2::date`,
          [trimmedUserId, weekStartStr]
        )
        .catch(() => {});
      return {
        details: "Compteur hebdomadaire audio remis à 0.",
        success: true,
      };
    }

    default:
      throw new Error(`Type de récompense inconnu: ${rewardType}`);
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
  const { answers, formId, rewardType, sessionToken, userId } = params;

  // 1. Vérifier l'existence et la validité du formulaire
  const formRows = await db
    .select()
    .from(userForm)
    .where(eq(userForm.id, formId))
    .limit(1);

  if (formRows.length === 0) {
    throw new Error("Formulaire introuvable.");
  }

  const f = formRows[0];
  if (!f.isActive) {
    throw new Error("Ce formulaire n'est plus actif.");
  }

  const now = new Date();
  if (f.startDate > now) {
    throw new Error("Ce formulaire n'a pas encore débuté.");
  }
  if (f.endDate && f.endDate < now) {
    throw new Error("Ce formulaire est expiré.");
  }

  // 2. Vérifier si l'utilisateur a déjà répondu
  const existingRows = await db
    .select()
    .from(userFormResponse)
    .where(
      and(
        eq(userFormResponse.formId, formId),
        eq(userFormResponse.userId, userId)
      )
    )
    .limit(1);

  if (existingRows.length > 0) {
    throw new Error("Vous avez déjà répondu à ce formulaire.");
  }

  // 3. Enregistrer la réponse
  await db.insert(userFormResponse).values({
    answers,
    formId,
    rewardAppliedAt: now,
    rewardResetApplied: true,
    rewardType,
    userId,
  });

  // 4. Appliquer la réinitialisation de limites
  const resetResult = await applyQuotaReset(userId, rewardType);

  // 5. Invalider le cache de session en mémoire si sessionToken fourni
  if (sessionToken) {
    invalidateMaiUserCache(sessionToken);
  }

  return {
    details: resetResult.details,
    rewardType,
    success: true,
  };
}
