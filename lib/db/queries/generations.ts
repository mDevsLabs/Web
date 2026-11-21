import "server-only";

import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import {
  type MprojectsImageGenerations,
  type MprojectsSpeechGenerations,
  mprojectsImageGenerations,
  mprojectsSpeechGenerations,
  weeklySpeechUsage,
} from "../schema";
import { dbReady } from "./connection";

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

export async function getImageGenerations(params: {
  userId: string;
  page?: number;
  limit?: number;
}) {
  const db = await dbReady();
  const { limit, offset } = resolvePagination(params);

  const [items, totalCount] = await Promise.all([
    db
      .select()
      .from(mprojectsImageGenerations)
      .where(eq(mprojectsImageGenerations.userId, params.userId))
      .orderBy(desc(mprojectsImageGenerations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(mprojectsImageGenerations)
      .where(eq(mprojectsImageGenerations.userId, params.userId)),
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

  const res = await db
    .select({ count: count() })
    .from(mprojectsImageGenerations)
    .where(
      and(
        eq(mprojectsImageGenerations.userId, userId),
        gte(mprojectsImageGenerations.createdAt, today)
      )
    );

  return res[0]?.count ?? 0;
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
      model: params.model ?? "black-forest-labs/flux-1-schnell",
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
      model: params.model ?? "deepgram/flux-tts:free",
      status: "completed",
      title: params.title ?? null,
      tokensCount:
        params.tokensCount ??
        Math.max(1, Math.ceil(params.inputText.length / 3.5)),
      userId: params.userId,
      voice: params.voice ?? "flux-alexis-en",
    })
    .returning();

  return inserted[0];
}

export async function deleteSpeechGeneration(params: {
  userId: string;
  id?: string | null;
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
        eq(mprojectsSpeechGenerations.id, params.id),
        eq(mprojectsSpeechGenerations.userId, params.userId)
      )
    );

  return { count: 1, success: true };
}
