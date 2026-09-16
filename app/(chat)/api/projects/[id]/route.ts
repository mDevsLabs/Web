import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  deleteProject,
  getProjectChats,
  getProjectMembers,
  updateProject,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  getProjectAccess,
  hasProjectManageAccess,
} from "@/lib/projects/access";

const patchSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  customInstructions: z.string().max(4000).nullable().optional(),
  defaultModel: z.string().max(100).nullable().optional(),
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

  // Garde centralisée : propriétaire OU membre. Un projectId deviné par un
  // utilisateur extérieur donne un 404, jamais les données du projet.
  const access = await getProjectAccess({ projectId: id, userEmail, userId });
  if (!access) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }

  // Espace partagé : conversations de TOUS les membres (l'utilisateur ne peut
  // modifier que les siennes — les routes de mutation revalident).
  const chats = await getProjectChats({ projectId: id });
  const members = await getProjectMembers({ projectId: id }).catch(() => []);

  return Response.json({
    members: members.map((m) => ({
      joinedAt: m.joinedAt,
      role: m.role,
      userId: m.userId,
    })),
    project: {
      ...access.project,
      role: access.role,
    },
    recentChats: chats,
  });
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

  const access = await getProjectAccess({ projectId: id, userEmail, userId });
  if (!access) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }
  // Réglages (instructions, modèle, nom…) : propriétaire uniquement. Un membre
  // reçoit un 403 même si l'UI masque le formulaire.
  if (!hasProjectManageAccess(access)) {
    return new ChatbotError(
      "forbidden:api",
      "Seul le propriétaire du projet peut modifier ses réglages."
    ).toResponse();
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const updated = await updateProject({
      color: parsed.color ?? undefined,
      customInstructions: parsed.customInstructions ?? undefined,
      defaultModel: parsed.defaultModel ?? undefined,
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

  const access = await getProjectAccess({ projectId: id, userEmail, userId });
  if (!access) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }
  // Suppression : propriétaire uniquement (les lignes membres/invites/fichiers
  // partent en cascade).
  if (!hasProjectManageAccess(access)) {
    return new ChatbotError(
      "forbidden:api",
      "Seul le propriétaire peut supprimer ce projet."
    ).toResponse();
  }

  const deleted = await deleteProject({ deleteChats, id, userEmail, userId });
  if (!deleted) {
    return new ChatbotError(
      "not_found:database",
      "Projet introuvable"
    ).toResponse();
  }

  return Response.json({ success: true });
}
