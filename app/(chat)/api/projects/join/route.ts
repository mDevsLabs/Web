import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  createNotification,
  getProjectById,
  getProjectForInviteJoin,
  getProjectInviteByCode,
  joinProjectWithInvite,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { getProjectAccess } from "@/lib/projects/access";
import { checkInviteUsability } from "@/lib/projects/permissions";

const joinSchema = z.object({
  code: z.string().min(8).max(64),
});

// Rejoindre un projet partagé via une invitation (code de lien OU code
// manuel). Authentification stricte : un utilisateur non connecté ne peut pas
// rejoindre, et le code ne révèle rien (l'aperçu de la page /projects/join
// est servi par la page, côté serveur, avec le même garde).
export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const userEmail = user.email;

  try {
    const body = await request.json();
    const parsed = joinSchema.parse(body);

    const invite = await getProjectInviteByCode({ code: parsed.code.trim() });
    const check = checkInviteUsability(invite);
    if (!check.ok || !invite) {
      const messages: Record<"exhausted" | "expired" | "revoked", string> = {
        exhausted:
          "Cette invitation a atteint son nombre maximal d'utilisations.",
        expired: "Cette invitation a expiré.",
        revoked: "Cette invitation n'est plus valide.",
      };
      const reason = check.ok ? "revoked" : check.reason;
      return new ChatbotError("bad_request:api", messages[reason]).toResponse();
    }

    // Propriétaire qui rouvre son propre lien : idempotent, sans insertion de
    // membre ni notification à soi-même.
    const ownedProject = await getProjectById({
      id: invite.projectId,
      userEmail,
      userId,
    });
    if (ownedProject) {
      return Response.json({
        alreadyMember: true,
        projectId: invite.projectId,
        role: "owner",
        success: true,
      });
    }

    // Lecture interne au parcours d'invitation : le nouvel arrivant n'est pas
    // propriétaire, donc `getProjectById` répondrait 404 à tort.
    const project = await getProjectForInviteJoin({ id: invite.projectId });
    if (!project) {
      return new ChatbotError(
        "not_found:database",
        "Ce projet n'existe plus."
      ).toResponse();
    }

    // L'existence du projet, la validité de l'invitation et sa limite d'usage
    // sont revérifiées DANS la transaction (verrou ligne) : le dernier code ne
    // peut pas être consommé deux fois par deux adhésions simultanées.
    const result = await joinProjectWithInvite({
      invite,
      invitedBy: invite.createdBy,
      userId,
    });

    if (!result.ok) {
      if (result.reason === "project_missing") {
        return new ChatbotError(
          "not_found:database",
          "Ce projet n'existe plus."
        ).toResponse();
      }
      const messages: Record<"exhausted" | "expired" | "revoked", string> = {
        exhausted:
          "Cette invitation a atteint son nombre maximal d'utilisations.",
        expired: "Cette invitation a expiré.",
        revoked: "Cette invitation n'est plus valide.",
      };
      return new ChatbotError(
        "bad_request:api",
        messages[result.reason]
      ).toResponse();
    }

    if (!result.alreadyMember) {
      // Notification au propriétaire (type project_member_joined, migration 0020).
      createNotification({
        body: `Un nouveau membre a rejoint le projet « ${project.name} ».`,
        link: `/projects/${project.id}`,
        title: "Nouveau membre",
        type: "project_member_joined" as const,
        userId: project.userId,
      }).catch(() => {});
    }

    // Le rôle effectif (owner si déjà propriétaire, member sinon) est renvoyé
    // pour que l'UI redirige directement vers l'espace.
    const access = await getProjectAccess({
      projectId: invite.projectId,
      userEmail,
      userId,
    });
    return Response.json({
      alreadyMember: result.alreadyMember,
      projectId: invite.projectId,
      role: access?.role ?? "member",
      success: true,
    });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    if (error instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", error.message).toResponse();
    }
    console.error("Join project error:", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}
