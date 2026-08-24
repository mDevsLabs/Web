import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteProject,
  getChatsByUserId,
  getProjectById,
  updateProject,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const patchSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  customInstructions: z.string().max(4000).nullable().optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  isArchived: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const userEmail = user.email;

  const project = await getProjectById({ id, userEmail, userId });
  if (!project) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }

  // Get recent chats preview
  const { chats } = await getChatsByUserId({
    endingBefore: null,
    id: userId,
    includeArchived: false,
    limit: 5,
    projectId: id,
    startingAfter: null,
    userEmail,
  });

  return Response.json({ project, recentChats: chats });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const userEmail = user.email;

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const updated = await updateProject({
      color: parsed.color ?? undefined,
      customInstructions: parsed.customInstructions ?? undefined,
      description: parsed.description?.trim(),
      icon: parsed.icon,
      id,
      isArchived: parsed.isArchived,
      name: parsed.name?.trim(),
      userEmail,
      userId,
    });

    if (!updated) {
      return new ChatbotError(
        "not_found:database",
        "Projet introuvable"
      ).toResponse();
    }

    return Response.json({ project: updated, success: true });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    if (error instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", error.message).toResponse();
    }
    console.error("Update project error:", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const userEmail = user.email;
  const { searchParams } = new URL(request.url);
  const deleteChats = searchParams.get("deleteChats") === "true";

  const deleted = await deleteProject({ deleteChats, id, userEmail, userId });
  if (!deleted) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }

  return Response.json({ success: true });
}
