import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  createProject,
  getProjectChatCounts,
  getProjectsByUserId,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const createSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  customInstructions: z.string().max(4000).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  name: z.string().min(1).max(100),
});

export async function GET(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const userEmail = user.email;
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";
  const search = searchParams.get("search") ?? undefined;

  const [projects, counts] = await Promise.all([
    getProjectsByUserId({ includeArchived, search, userEmail, userId }),
    getProjectChatCounts({ includeArchived, userEmail, userId }),
  ]);

  const countMap = new Map(counts.map((c) => [c.projectId, c.count]));
  const withCounts = projects.map((p) => ({
    ...p,
    chatCount: p.id ? (countMap.get(p.id) ?? 0) : 0,
  }));

  // Also count unassigned chats
  const unassignedCount = counts.find((c) => c.projectId === null)?.count ?? 0;

  return Response.json({ projects: withCounts, unassignedCount });
}

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const userEmail = user.email;

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    // Limit projects per user
    const existing = await getProjectsByUserId({
      includeArchived: true,
      userEmail,
      userId,
    });
    if (existing.length >= 50) {
      return new ChatbotError(
        "bad_request:api",
        "Limite de 50 projets atteinte."
      ).toResponse();
    }

    const project = await createProject({
      color: parsed.color,
      customInstructions: parsed.customInstructions?.trim(),
      description: parsed.description?.trim(),
      icon: parsed.icon,
      name: parsed.name.trim(),
      userId,
    });

    return Response.json({ project, success: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    if (error instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", error.message).toResponse();
    }
    console.error("Create project error:", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}
