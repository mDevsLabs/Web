import { getMaiUser } from "@/lib/auth/session";
import { memoryLimitForTier } from "@/lib/auth/plan";
import { ChatbotError } from "@/lib/errors";
import {
  countMemories,
  createMemory,
  deleteMemory,
  getAgentById,
  getAgentMemories,
  getGlobalMemories,
  getProjectById,
  getProjectMemories,
  getUserMemoriesWithScope,
  updateMemory,
} from "@/lib/db/queries";
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { z } from "zod";

const createSchema = z
  .object({
    agentId: z.string().uuid().nullable().optional(),
    category: z.string().max(50).optional(),
    content: z.string().min(1).max(MEMORY_CONTENT_MAX_LENGTH),
    isEnabled: z.boolean().optional(),
    isImportant: z.boolean().optional(),
    projectId: z.string().uuid().nullable().optional(),
    tags: z.array(z.string().max(30)).optional(),
  })
  .refine((data) => !(data.agentId && data.projectId), {
    message: "Un seul scope autorisé (agent ou projet)",
  });

const updateSchema = z.object({
  category: z.string().max(50).optional(),
  content: z.string().min(1).max(MEMORY_CONTENT_MAX_LENGTH).optional(),
  id: z.string().uuid(),
  isEnabled: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  tags: z.array(z.string().max(30)).optional(),
});

async function resolveScope(
  userId: string,
  userEmail: string,
  agentId: string | null,
  projectId: string | null
) {
  if (agentId) {
    const agent = await getAgentById({ id: agentId, userId });
    if (!agent) {
      return null;
    }
    return { agentId, projectId: null } as const;
  }
  if (projectId) {
    const project = await getProjectById({
      id: projectId,
      userId,
      userEmail,
    });
    if (!project) {
      return null;
    }
    return { agentId: null, projectId } as const;
  }
  return { agentId: null, projectId: null } as const;
}

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const projectId = searchParams.get("projectId");
    if (searchParams.get("scope") === "all") {
      const memories = await getUserMemoriesWithScope({ userId });
      return Response.json({
        limit: memoryLimitForTier(user.tier),
        memories,
      });
    }
    const scope = await resolveScope(
      userId,
      user.email,
      agentId,
      projectId
    );
    if (!scope) {
      return new ChatbotError("not_found:database").toResponse();
    }
    const memories = scope.agentId
      ? await getAgentMemories({ agentId: scope.agentId, userId })
      : scope.projectId
        ? await getProjectMemories({
            projectId: scope.projectId,
            userId,
          })
        : await getGlobalMemories({ userId });
    return Response.json({
      limit: memoryLimitForTier(user.tier),
      memories,
    });
  } catch (e) {
    console.error("GET memory error", e);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const content = parsed.content.replace(/\u0000/g, "").trim();
    if (!content) {
      return new ChatbotError(
        "bad_request:api",
        "Contenu de mémoire vide"
      ).toResponse();
    }
    const scope = await resolveScope(
      userId,
      user.email,
      parsed.agentId ?? null,
      parsed.projectId ?? null
    );
    if (!scope) {
      return new ChatbotError("not_found:database").toResponse();
    }
    const total = await countMemories({
      agentId: scope.agentId,
      projectId: scope.projectId,
      userId,
    });
    const limit = memoryLimitForTier(user.tier);
    if (total >= limit) {
      return new ChatbotError(
        "bad_request:api",
        `Limite de ${limit} mémoires atteinte pour ce scope`
      ).toResponse();
    }
    const memory = await createMemory({
      agentId: scope.agentId,
      category: parsed.category ?? "general",
      content,
      isEnabled: parsed.isEnabled ?? true,
      isImportant: parsed.isImportant ?? false,
      projectId: scope.projectId,
      tags: parsed.tags ?? [],
      userId,
    });
    return Response.json({ memory });
  } catch (e) {
    console.error("POST memory error", e);
    if (e instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", e.message).toResponse();
    }
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function DELETE(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return new ChatbotError("bad_request:api", "id requis").toResponse();
    }
    const deleted = await deleteMemory({ id, userId });
    if (!deleted) {
      return new ChatbotError("not_found:database").toResponse();
    }
    return Response.json({ success: true });
  } catch (e) {
    console.error("DELETE memory error", e);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function PATCH(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const updated = await updateMemory({
      category: parsed.category,
      content: parsed.content,
      id: parsed.id,
      isEnabled: parsed.isEnabled,
      isImportant: parsed.isImportant,
      tags: parsed.tags,
      userId,
    });
    if (!updated) {
      return new ChatbotError("not_found:database").toResponse();
    }
    return Response.json({ memory: updated });
  } catch (e) {
    console.error("PATCH memory error", e);
    if (e instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", e.message).toResponse();
    }
    return new ChatbotError("bad_request:database").toResponse();
  }
}
