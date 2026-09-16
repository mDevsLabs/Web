import { z } from "zod";
import { requireAgentToolMetadata } from "@/lib/agent/tools/catalog";
import { defineTool } from "@/lib/agent/tools/define-tool";
import { toolFailure, toolSuccess } from "@/lib/agent/types";
import {
  attachDocumentToProject,
  getDocumentById,
} from "@/lib/db/queries";
import { getProjectAccess } from "@/lib/projects/access";

const attachToProjectInputSchema = z.object({
  documentId: z
    .uuid()
    .describe("Identifiant du livrable à conserver dans le projet."),
  projectId: z.uuid().describe("Identifiant du projet de l'utilisateur."),
});

// Modification d'un projet : action soumise à une ApprovalRequest persistante
// (permission « ask »). L'outil revérifie lui-même la propriété des deux objets
// côté serveur — le modèle ne peut pas rattacher un livrable étranger, même en
// devinant un identifiant.
export const attachToProjectTool = defineTool({
  ...requireAgentToolMetadata("attach_to_project"),
  execute: async (input, context) => {
    const document_ = await getDocumentById({ id: input.documentId }).catch(
      () => null
    );
    if (!document_ || document_.userId !== context.userId) {
      return toolFailure(
        "document_unavailable",
        "Livrable introuvable dans votre espace.",
        { category: "permanent", retryable: false }
      );
    }

    // Espace partagé : le rattachement est permis au propriétaire OU au
    // membre du projet (garde centralisée, jamais la seule validité UUID).
    const access = await getProjectAccess({
      projectId: input.projectId,
      userEmail: context.userEmail,
      userId: context.userId,
    }).catch(() => null);
    if (!access) {
      return toolFailure("project_unavailable", "Projet introuvable.", {
        category: "permanent",
        retryable: false,
      });
    }

    const updated = await attachDocumentToProject({
      documentId: input.documentId,
      projectId: input.projectId,
      userId: context.userId,
    }).catch(() => null);

    if (!updated) {
      return toolFailure(
        "attach_failed",
        "Rattachement du livrable au projet impossible.",
        { category: "transient", retryable: true }
      );
    }

    const title = updated.title ?? "Livrable";

    return toolSuccess(
      {
        documentId: input.documentId,
        kind: updated.kind,
        projectId: input.projectId,
        projectName: access.project.name,
        title,
      },
      [
        {
          id: `project-${input.projectId}`,
          kind: "project",
          title: access.project.name,
        },
      ],
      {
        artifact: {
          documentId: input.documentId,
          kind: updated.kind ?? "text",
          title,
        },
      }
    );
  },
  schema: attachToProjectInputSchema,
  summarize: (data) => {
    const value = (data ?? {}) as { projectName?: string; title?: string };
    return `Livrable « ${(value.title ?? "livrable").slice(0, 60)} » ajouté à ${
      value.projectName ?? "un projet"
    }`;
  },
});
