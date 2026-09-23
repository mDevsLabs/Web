import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  createProjectInvite,
  getActiveProjectInvite,
  revokeProjectInvites,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  getProjectAccess,
  hasMemberManagementAccess,
} from "@/lib/projects/access";

// Invitations d'un projet partagé : propriétaire uniquement. Le code sert à
// la fois de lien partageable (/projects/join/[code]) et de code manuel.
const postSchema = z.object({
  // Durée de validité en jours (défaut 7, max 90). null = sans expiration.
  expiresInDays: z.number().int().min(1).max(90).nullable().optional(),
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
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

  const access = await getProjectAccess({ projectId: id, userEmail, userId });
  if (!access) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }
  if (!hasMemberManagementAccess(access)) {
    return new ChatbotError(
      "forbidden:api",
      "Seul le propriétaire peut gérer les invitations."
    ).toResponse();
  }

  const invite = await getActiveProjectInvite({ projectId: id });
  return Response.json({ invite });
}

export async function POST(
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

  const access = await getProjectAccess({ projectId: id, userEmail, userId });
  if (!access) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }
  if (!hasMemberManagementAccess(access)) {
    return new ChatbotError(
      "forbidden:api",
      "Seul le propriétaire peut gérer les invitations."
    ).toResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = postSchema.parse(body);

    // Une seule invitation active par projet (index unique partiel) : on
    // renvoie l'existante plutôt que d'en créer une nouvelle.
    const existing = await getActiveProjectInvite({ projectId: id });
    if (existing) {
      return Response.json({ invite: existing });
    }

    const expiresAt = parsed.expiresInDays
      ? new Date(Date.now() + parsed.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    const invite = await createProjectInvite({
      createdBy: userId,
      expiresAt,
      maxUses: parsed.maxUses ?? null,
      projectId: id,
    });
    return Response.json({ invite });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    if (error instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", error.message).toResponse();
    }
    console.error("Create invite error:", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function DELETE(
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

  const access = await getProjectAccess({ projectId: id, userEmail, userId });
  if (!access) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }
  if (!hasMemberManagementAccess(access)) {
    return new ChatbotError(
      "forbidden:api",
      "Seul le propriétaire peut gérer les invitations."
    ).toResponse();
  }

  await revokeProjectInvites({ projectId: id });
  return Response.json({ success: true });
}
