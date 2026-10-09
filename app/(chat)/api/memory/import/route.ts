import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { memoryLimitForTier } from "@/lib/auth/plan";
import { getMaiUser } from "@/lib/auth/session";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import {
  countMemories,
  createMemory,
  getUserMemoriesWithScope,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const memoryImportItemSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  content: z.string().min(1).max(MEMORY_CONTENT_MAX_LENGTH),
  isEnabled: z.boolean().optional().default(true),
  isImportant: z.boolean().optional().default(false),
  projectId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(30)).optional().default([]),
});

// Le quota de forfait borne le nombre d'écritures, mais il ne borne pas la
// TAILLE de la requête : le tableau n'avait pas de plafond, et chacun de ses
// éléments déclenche un INSERT. On aligne la borne sur le plus grand quota de
// forfait (Max, 150 entrées) : au-delà, l'appel est de toute façon refusé
// plus bas par le quota, et le client reçoit un message de forfait explicite
// plutôt qu'une erreur de validation.
const MEMORY_IMPORT_MAX_ENTRIES = 150;

const importSchema = z.object({
  memories: z
    .array(memoryImportItemSchema)
    .min(1)
    .max(MEMORY_IMPORT_MAX_ENTRIES),
  scope: z
    .enum(["all", "global", "agent", "project"])
    .optional()
    .default("all"),
});

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;

  const limited = await enforceApiRateLimit({
    action: "memory_import",
    request,
    userId,
  });
  if (limited) {
    return limited;
  }

  try {
    const body = await request.json();
    const parsed = importSchema.parse(body);
    const limit = memoryLimitForTier(user.tier);

    // Récupérer les mémoires existantes pour vérifier les doublons et les quotas
    const existing = await getUserMemoriesWithScope({ userId });
    const currentCount = existing.length;
    const remainingSlots = Math.max(0, limit - currentCount);

    if (remainingSlots === 0) {
      return errorResponse("quota_exceeded", {
        details: { limit, remaining: 0 },
        message: `Limite de forfait atteinte (${limit} mémoires max pour le forfait ${user.tier}). Passez à un forfait supérieur pour en ajouter davantage.`,
        status: 400,
      });
    }

    if (parsed.memories.length > remainingSlots) {
      return errorResponse("quota_exceeded", {
        details: { limit, remaining: remainingSlots },
        message: `Impossible d'importer ${parsed.memories.length} mémoires : votre forfait (${user.tier}) n'a que ${remainingSlots} place(s) disponible(s) (limite : ${limit}).`,
        status: 400,
      });
    }

    const existingContents = new Set(
      existing.map((m) => m.content.toLowerCase().trim())
    );

    const inserted: Awaited<ReturnType<typeof createMemory>>[] = [];
    let skippedCount = 0;

    for (const item of parsed.memories) {
      const cleanContent = item.content
        .replace(new RegExp(String.fromCharCode(0), "g"), "")
        .trim();
      if (!cleanContent) {
        continue;
      }

      // Éviter les doublons exacts
      if (existingContents.has(cleanContent.toLowerCase())) {
        skippedCount++;
        continue;
      }

      const created = await createMemory({
        agentId: item.agentId ?? null,
        content: cleanContent,
        isEnabled: item.isEnabled ?? true,
        isImportant: item.isImportant ?? false,
        projectId: item.projectId ?? null,
        tags: item.tags ?? [],
        userId,
      });

      if (created) {
        inserted.push(created);
        existingContents.add(cleanContent.toLowerCase());
      }
    }

    return Response.json({
      count: inserted.length,
      limit,
      skipped: skippedCount,
      success: true,
      totalRemaining: Math.max(0, limit - (currentCount + inserted.length)),
    });
  } catch (e) {
    console.error("POST /api/memory/import error", e);
    if (e instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: "Format JSON invalide pour l'import de mémoire.",
      });
    }
    return new ChatbotError("bad_request:database").toResponse();
  }
}
