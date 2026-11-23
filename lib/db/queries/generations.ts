import "server-only";

import { and, count, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import {
  DEFAULT_AUDIO_MODEL,
  DEFAULT_AUDIO_VOICE,
  DEFAULT_IMAGE_MODEL,
} from "@/lib/ai/catalog/media-defaults";
import {
  type MprojectsImageGenerations,
  type MprojectsSpeechGenerations,
  mprojectsImageGenerations,
  mprojectsSpeechGenerations,
  weeklySpeechUsage,
} from "../schema";
import { dbReady } from "./connection";

// Une réservation `pending` qui survit plus de 5 min correspond à un worker
// interrompu : elle ne doit pas bloquer définitivement le quota de l'utilisateur.
const IMAGE_RESERVATION_TTL_MS = 5 * 60 * 1000;

// Pagination bornée et entière : un `page=1.5` produisait un OFFSET décimal,
// donc une erreur SQL.
function resolvePagination(params: { page?: number; limit?: number }) {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(params.limit) || 20))
  );
  return { limit, offset: (page - 1) * limit };
}

// La colonne `api_key` ne doit jamais quitter le serveur : les lignes sont
// sérialisées ici, sans elle, avant d'être renvoyées aux routes.
function toPublicImage({ apiKey: _apiKey, ...row }: MprojectsImageGenerations) {
  return {
    ...row,
    created_at: row.createdAt?.toISOString(),
    image_url: row.imageUrl,
    negative_prompt: row.negativePrompt,
    user_id: row.userId,
  };
}

function toPublicSpeech({
  apiKey: _apiKey,
  ...row
}: MprojectsSpeechGenerations) {
  return {
    ...row,
    audio_url: row.audioUrl,
    character_count: row.characterCount,
    created_at: row.createdAt?.toISOString(),
    id: String(row.id),
    input_text: row.inputText,
    tokens_count: row.tokensCount,
    user_id: row.userId,
  };
}

// Lundi 00:00 UTC de la semaine courante : borne de réinitialisation des quotas
// hebdomadaires (cf. lib/plans/usage-engine.ts).
export function getUtcWeekStart(now: Date = new Date()): Date {
  const day = now.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset)
  );
}

function weekStartKey(): string {
  return getUtcWeekStart().toISOString().slice(0, 10);
}

// Estimation historique du backend Speech : ~3,5 caractères par token.
export function estimateSpeechTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().length / 3.5));
}

// Consommation Speech de la semaine. Les lignes historiques sont indexées par
// identifiant, e-mail ou nom d'utilisateur : on additionne les clés fournies.
export async function getWeeklySpeechUsage(
  userKeys: Array<string | null | undefined>
): Promise<{ requestsCount: number; tokensUsed: number }> {
  const keys = [
    ...new Set(userKeys.filter((key): key is string => Boolean(key))),
  ];
  if (keys.length === 0) {
    return { requestsCount: 0, tokensUsed: 0 };
  }
  const db = await dbReady();
  const rows = await db
    .select({
      requestsCount: sql<string>`coalesce(sum(${weeklySpeechUsage.requestsCount}), 0)`,
      tokensUsed: sql<string>`coalesce(sum(${weeklySpeechUsage.tokensUsed}), 0)`,
    })
    .from(weeklySpeechUsage)
    .where(
      and(
        inArray(weeklySpeechUsage.userId, keys),
        eq(weeklySpeechUsage.weekStart, weekStartKey())
      )
    );
  return {
    requestsCount: Number(rows[0]?.requestsCount ?? 0),
    tokensUsed: Number(rows[0]?.tokensUsed ?? 0),
  };
}

// Incrément atomique (upsert) de la consommation Speech hebdomadaire.
export async function addWeeklySpeechUsage(
  userId: string,
  tokens: number
): Promise<void> {
  const db = await dbReady();
  await db
    .insert(weeklySpeechUsage)
    .values({
      requestsCount: 1,
      tokensUsed: tokens,
      userId,
      weekStart: weekStartKey(),
    })
    .onConflictDoUpdate({
      set: {
        requestsCount: sql`${weeklySpeechUsage.requestsCount} + 1`,
        tokensUsed: sql`${weeklySpeechUsage.tokensUsed} + ${tokens}`,
        updatedAt: new Date(),
      },
      target: [weeklySpeechUsage.userId, weeklySpeechUsage.weekStart],
    });
}

export type SpeechQuotaReservationResult =
  | {
      limit: number;
      ok: true;
      used: number;
      weekStart: string;
    }
  | {
      limit: number;
      ok: false;
      used: number;
    };

/**
 * Réservation atomique du quota Speech hebdomadaire AVANT tout appel externe
 * (BUG-001 & BUG-003). Le verrou consultatif transactionnel sérialise les
 * requêtes concurrentes du même compte, y compris quand la ligne hebdomadaire
 * n'existe pas encore.
 */
export async function reserveWeeklySpeechQuota(params: {
  tokens: number;
  userId: string;
  userKeys: Array<string | null | undefined>;
  weeklyLimit: number;
}): Promise<SpeechQuotaReservationResult> {
  const db = await dbReady();
  const weekStart = weekStartKey();
  const keys = [
    ...new Set(
      [params.userId, ...params.userKeys].filter((key): key is string =>
        Boolean(key)
      )
    ),
  ];
  const lockKey = `speech_quota:${params.userId}`;

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

    const rows = await tx
      .select({
        tokensUsed: sql<string>`coalesce(sum(${weeklySpeechUsage.tokensUsed}), 0)`,
      })
      .from(weeklySpeechUsage)
      .where(
        and(
          inArray(weeklySpeechUsage.userId, keys),
          eq(weeklySpeechUsage.weekStart, weekStart)
        )
      );

    const currentUsed = Number(rows[0]?.tokensUsed ?? 0);
    if (
      params.weeklyLimit > 0 &&
      currentUsed + params.tokens > params.weeklyLimit
    ) {
      return {
        limit: params.weeklyLimit,
        ok: false as const,
        used: currentUsed,
      };
    }

    await tx
      .insert(weeklySpeechUsage)
      .values({
        requestsCount: 1,
        tokensUsed: params.tokens,
        userId: params.userId,
        weekStart,
      })
      .onConflictDoUpdate({
        set: {
          requestsCount: sql`${weeklySpeechUsage.requestsCount} + 1`,
          tokensUsed: sql`${weeklySpeechUsage.tokensUsed} + ${params.tokens}`,
          updatedAt: new Date(),
        },
        target: [weeklySpeechUsage.userId, weeklySpeechUsage.weekStart],
      });

    return {
      limit: params.weeklyLimit,
      ok: true as const,
      used: currentUsed + params.tokens,
      weekStart,
    };
  });
}

/**
 * Libération atomique d'une réservation Speech en cas d'échec du fournisseur
 * externe ou de réponse audio vide.
 */
export async function releaseWeeklySpeechQuota(params: {
  tokens: number;
  userId: string;
  weekStart?: string;
}): Promise<void> {
  const db = await dbReady();
  const weekStart = params.weekStart ?? weekStartKey();
  const lockKey = `speech_quota:${params.userId}`;

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);
    await tx
      .update(weeklySpeechUsage)
      .set({
        requestsCount: sql`GREATEST(0, ${weeklySpeechUsage.requestsCount} - 1)`,
        tokensUsed: sql`GREATEST(0, ${weeklySpeechUsage.tokensUsed} - ${params.tokens})`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(weeklySpeechUsage.userId, params.userId),
          eq(weeklySpeechUsage.weekStart, weekStart)
        )
      );
  });
}

export async function getImageGenerations(params: {
  userId: string;
  page?: number;
  limit?: number;
}) {
  const db = await dbReady();
  const { limit, offset } = resolvePagination(params);
  const completedFilter = and(
    eq(mprojectsImageGenerations.userId, params.userId),
    eq(mprojectsImageGenerations.status, "completed")
  );

  const [items, totalCount] = await Promise.all([
    db
      .select()
      .from(mprojectsImageGenerations)
      .where(completedFilter)
      .orderBy(desc(mprojectsImageGenerations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(mprojectsImageGenerations)
      .where(completedFilter),
  ]);

  return {
    items: items.map(toPublicImage),
    total: totalCount[0]?.count ?? items.length,
  };
}

export async function countTodayImageGenerations(
  userId: string
): Promise<number> {
  const db = await dbReady();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - IMAGE_RESERVATION_TTL_MS);

  const res = await db
    .select({ count: count() })
    .from(mprojectsImageGenerations)
    .where(
      and(
        eq(mprojectsImageGenerations.userId, userId),
        gte(mprojectsImageGenerations.createdAt, today),
        or(
          eq(mprojectsImageGenerations.status, "completed"),
          and(
            eq(mprojectsImageGenerations.status, "pending"),
            gte(mprojectsImageGenerations.createdAt, staleCutoff)
          )
        )
      )
    );

  return res[0]?.count ?? 0;
}

export type ImageQuotaReservationResult =
  | {
      limit: number;
      ok: true;
      reservationId: string;
      used: number;
    }
  | {
      limit: number;
      ok: false;
      used: number;
    };

/**
 * Réservation atomique d'une unité de quota d'image journalier AVANT l'appel
 * externe (BUG-001 & BUG-003). Une ligne `status = 'pending'` est insérée sous
 * verrou consultatif transactionnel, confirmée après succès ou supprimée en cas
 * d'échec fournisseur.
 */
export async function reserveDailyImageQuota(params: {
  dailyLimit: number;
  height?: number;
  model?: string;
  negativePrompt?: string | null;
  prompt: string;
  title?: string;
  userId: string;
  width?: number;
}): Promise<ImageQuotaReservationResult> {
  const db = await dbReady();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const staleCutoff = new Date(Date.now() - IMAGE_RESERVATION_TTL_MS);
  const lockKey = `image_quota:${params.userId}`;

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

    const res = await tx
      .select({ count: count() })
      .from(mprojectsImageGenerations)
      .where(
        and(
          eq(mprojectsImageGenerations.userId, params.userId),
          gte(mprojectsImageGenerations.createdAt, today),
          or(
            eq(mprojectsImageGenerations.status, "completed"),
            and(
              eq(mprojectsImageGenerations.status, "pending"),
              gte(mprojectsImageGenerations.createdAt, staleCutoff)
            )
          )
        )
      );

    const usedToday = Number(res[0]?.count ?? 0);
    if (params.dailyLimit > 0 && usedToday >= params.dailyLimit) {
      return {
        limit: params.dailyLimit,
        ok: false as const,
        used: usedToday,
      };
    }

    const inserted = await tx
      .insert(mprojectsImageGenerations)
      .values({
        height: params.height ?? 1024,
        imageUrl: "",
        model: params.model ?? DEFAULT_IMAGE_MODEL,
        negativePrompt: params.negativePrompt ?? null,
        prompt: params.prompt,
        status: "pending",
        title: params.title ?? null,
        userId: params.userId,
        width: params.width ?? 1024,
      })
      .returning({ id: mprojectsImageGenerations.id });

    const reservationId = inserted[0]?.id;
    if (!reservationId) {
      throw new Error("Impossible de créer la réservation de quota image.");
    }

    return {
      limit: params.dailyLimit,
      ok: true as const,
      reservationId,
      used: usedToday + 1,
    };
  });
}

/** Confirme une réservation d'image après succès du fournisseur. */
export async function confirmImageGenerationReservation(params: {
  imageUrl: string;
  reservationId: string;
  userId: string;
}): Promise<void> {
  const db = await dbReady();
  await db
    .update(mprojectsImageGenerations)
    .set({
      imageUrl: params.imageUrl,
      status: "completed",
    })
    .where(
      and(
        eq(mprojectsImageGenerations.id, params.reservationId),
        eq(mprojectsImageGenerations.userId, params.userId)
      )
    );
}

/** Libère une réservation `pending` en cas d'échec fournisseur. */
export async function releaseImageGenerationReservation(params: {
  reservationId: string;
  userId: string;
}): Promise<void> {
  const db = await dbReady();
  await db
    .delete(mprojectsImageGenerations)
    .where(
      and(
        eq(mprojectsImageGenerations.id, params.reservationId),
        eq(mprojectsImageGenerations.userId, params.userId),
        eq(mprojectsImageGenerations.status, "pending")
      )
    );
}

export async function recordImageGeneration(params: {
  userId: string;
  prompt: string;
  imageUrl: string;
  negativePrompt?: string | null;
  model?: string;
  width?: number;
  height?: number;
  title?: string;
}) {
  const db = await dbReady();
  const inserted = await db
    .insert(mprojectsImageGenerations)
    .values({
      height: params.height ?? 1024,
      imageUrl: params.imageUrl,
      model: params.model ?? DEFAULT_IMAGE_MODEL,
      negativePrompt: params.negativePrompt ?? null,
      prompt: params.prompt,
      status: "completed",
      title: params.title ?? null,
      userId: params.userId,
      width: params.width ?? 1024,
    })
    .returning();

  return inserted[0];
}

export async function deleteImageGeneration(params: {
  userId: string;
  id?: string | null;
  purgeAll?: boolean;
}) {
  const db = await dbReady();
  if (params.purgeAll) {
    await db
      .delete(mprojectsImageGenerations)
      .where(eq(mprojectsImageGenerations.userId, params.userId));
    return { count: -1, success: true };
  }

  if (!params.id) {
    return { count: 0, success: false };
  }

  await db
    .delete(mprojectsImageGenerations)
    .where(
      and(
        eq(mprojectsImageGenerations.id, params.id),
        eq(mprojectsImageGenerations.userId, params.userId)
      )
    );

  return { count: 1, success: true };
}

export async function updateImageGeneration(params: {
  userId: string;
  id: string;
  pinned?: boolean;
  title?: string;
}) {
  const db = await dbReady();
  const updates: { pinned?: boolean; title?: string } = {};
  if (params.pinned !== undefined) {
    updates.pinned = params.pinned;
  }
  if (params.title !== undefined) {
    updates.title = params.title.trim().slice(0, 200);
  }

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const res = await db
    .update(mprojectsImageGenerations)
    .set(updates)
    .where(
      and(
        eq(mprojectsImageGenerations.id, params.id),
        eq(mprojectsImageGenerations.userId, params.userId)
      )
    )
    .returning();

  return res[0] ? toPublicImage(res[0]) : null;
}

export async function getSpeechGenerations(params: {
  userId: string;
  page?: number;
  limit?: number;
}) {
  const db = await dbReady();
  const { limit, offset } = resolvePagination(params);

  const [items, totalCount] = await Promise.all([
    db
      .select()
      .from(mprojectsSpeechGenerations)
      .where(eq(mprojectsSpeechGenerations.userId, params.userId))
      .orderBy(desc(mprojectsSpeechGenerations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(mprojectsSpeechGenerations)
      .where(eq(mprojectsSpeechGenerations.userId, params.userId)),
  ]);

  return {
    items: items.map(toPublicSpeech),
    total: totalCount[0]?.count ?? items.length,
  };
}

export async function recordSpeechGeneration(params: {
  userId: string;
  inputText: string;
  audioUrl?: string | null;
  model?: string;
  voice?: string;
  characterCount?: number;
  tokensCount?: number;
  title?: string;
}) {
  const db = await dbReady();
  const inserted = await db
    .insert(mprojectsSpeechGenerations)
    .values({
      audioUrl: params.audioUrl ?? null,
      characterCount: params.characterCount ?? params.inputText.length,
      inputText: params.inputText,
      model: params.model ?? DEFAULT_AUDIO_MODEL,
      status: "completed",
      title: params.title ?? null,
      tokensCount:
        params.tokensCount ??
        Math.max(1, Math.ceil(params.inputText.length / 3.5)),
      userId: params.userId,
      voice: params.voice ?? DEFAULT_AUDIO_VOICE,
    })
    .returning();

  return inserted[0];
}

export async function deleteSpeechGeneration(params: {
  userId: string;
  id?: number | string | null;
  purgeAll?: boolean;
}) {
  const db = await dbReady();
  if (params.purgeAll) {
    await db
      .delete(mprojectsSpeechGenerations)
      .where(eq(mprojectsSpeechGenerations.userId, params.userId));
    return { count: -1, success: true };
  }

  if (!params.id) {
    return { count: 0, success: false };
  }

  await db
    .delete(mprojectsSpeechGenerations)
    .where(
      and(
        sql`${mprojectsSpeechGenerations.id}::text = ${String(params.id)}`,
        eq(mprojectsSpeechGenerations.userId, params.userId)
      )
    );

  return { count: 1, success: true };
}
