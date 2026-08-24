import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteProject,
  getProjectById,
  updateProject,
  getChatsByUserId,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;

  const project = await getProjectById({ id, userId });
  if (!project) return new ChatbotError("not_found:database", "Projet introuvable").toResponse();

  // Get recent chats preview
  const { chats } = await getChatsByUserId({
    id: userId,
    limit: 5,
    startingAfter: null,
    endingBefore: null,
    projectId: id,
    includeArchived: false,
  });

  return Response.json({ project, recentChats: chats });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const updated = await updateProject({
      id,
      userId,
      name: parsed.name?.trim(),
      description: parsed.description?.trim(),
      icon: parsed.icon,
      color: parsed.color ?? undefined,
      isArchived: parsed.isArchived,
    });

    if (!updated) return new ChatbotError("not_found:database", "Projet introuvable").toResponse();

    return Response.json({ success: true, project: updated });
  } catch (error) {
    if (error instanceof ChatbotError) return error.toResponse();
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
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const deleteChats = searchParams.get("deleteChats") === "true";

  const deleted = await deleteProject({ id, userId, deleteChats });
  if (!deleted) return new ChatbotError("not_found:database", "Projet introuvable").toResponse();

  return Response.json({ success: true });
}
