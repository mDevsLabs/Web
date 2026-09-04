import { z } from "zod";
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
  category: z.string().max(50).optional().default("general"),
  content: z.string().min(1).max(MEMORY_CONTENT_MAX_LENGTH),
  isEnabled: z.boolean().optional().default(true),
  isImportant: z.boolean().optional().default(false),
  projectId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(30)).optional().default([]),
});

const importSchema = z.object({
  memories: z.array(memoryImportItemSchema).min(1),
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

  try {
    const body = await request.json();
    const parsed = importSchema.parse(body);
    const limit = memoryLimitForTier(user.tier);

    // Récupérer les mémoires existantes pour vérifier les doublons et les quotas
    const existing = await getUserMemoriesWithScope({ userId });
    const currentCount = existing.length;
    const remainingSlots = Math.max(0, limit - currentCount);

    if (remainingSlots === 0) {
      return Response.json(
        {
          error: `Limite de forfait atteinte (${limit} mémoires max pour le forfait ${user.tier}). Passez à un forfait supérieur pour en ajouter davantage.`,
          limit,
          remaining: 0,
        },
        { status: 400 }
      );
    }

    if (parsed.memories.length > remainingSlots) {
      return Response.json(
        {
          error: `Impossible d'importer ${parsed.memories.length} mémoires : votre forfait (${user.tier}) n'a que ${remainingSlots} place(s) disponible(s) (limite : ${limit}).`,
          limit,
          remaining: remainingSlots,
        },
        { status: 400 }
      );
    }

    const existingContents = new Set(
      existing.map((m) => m.content.toLowerCase().trim())
    );

    const inserted = [];
    let skippedCount = 0;

    for (const item of parsed.memories) {
      const cleanContent = item.content.replace(/\u0000/g, "").trim();
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
        category: item.category ?? "general",
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
      return Response.json(
        { error: "Format JSON invalide pour l'import de mémoire." },
        { status: 400 }
      );
    }
    return new ChatbotError("bad_request:database").toResponse();
  }
}
