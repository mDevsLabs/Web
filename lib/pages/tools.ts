import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { hashContent } from "@/lib/artifacts/hash";
import { applyDocumentPatch, documentPatchSchema } from "@/lib/artifacts/patch";
import {
  createPageProposal,
  getPageById,
  PageContentTooLong,
  PageRevisionConflict,
  updatePageContent,
} from "@/lib/db/queries/pages";
import { PAGE_TITLE_MAX } from "@/lib/pages/limits";
import type { PageUpdatedEvent } from "@/lib/pages/types";

type PageWriter = {
  write: (part: any) => void;
};

function notify(writer: PageWriter, part: unknown) {
  try {
    writer.write(part);
  } catch {
    // Le flux est déjà fermé : l'écriture en base reste valable.
  }
}

function patchError(result: { errors: Array<{ message: string }> }): string {
  return result.errors.map((error) => error.message).join(" ");
}

export function createPageTools(params: {
  pageId: string;
  userId: string;
  writer: PageWriter;
}) {
  const load = () => getPageById(params.pageId);

  return {
    lire_page: tool({
      description:
        "Lit la page courante : titre, contenu Markdown, révision et empreinte baseHash. À appeler avant toute modification.",
      execute: async () => {
        const current = await load();
        if (!current || current.userId !== params.userId) {
          return { error: "Page introuvable." };
        }
        return {
          baseHash: hashContent(current.content),
          content: current.content,
          revision: current.revision,
          title: current.title,
        };
      },
      inputSchema: z.object({}),
    }),
    modifier_page: tool({
      description:
        "Applique tout de suite un patch ciblé sur la page. baseHash doit venir de lire_page. En cas d'échec, relis la page.",
      execute: async (input) => {
        const current = await load();
        if (!current || current.userId !== params.userId) {
          return { error: "Page introuvable." };
        }
        const applied = applyDocumentPatch(current.content, input);
        if (!applied.ok) {
          return {
            baseHash: hashContent(current.content),
            error: patchError(applied),
          };
        }
        try {
          const updated = await updatePageContent({
            content: applied.content,
            createdBy: params.userId,
            expectedRevision: current.revision,
            pageId: current.id,
            snapshot: "assistant",
            userId: current.userId,
          });
          if (!updated) {
            return { error: "Page introuvable." };
          }
          const event: PageUpdatedEvent = {
            content: updated.content,
            revision: updated.revision,
            title: updated.title,
          };
          notify(params.writer, {
            data: event,
            transient: true,
            type: "data-page-updated",
          });
          return {
            applied: true,
            baseHash: hashContent(updated.content),
            revision: updated.revision,
          };
        } catch (error) {
          if (error instanceof PageRevisionConflict) {
            return {
              error:
                "La page a changé. Appelle lire_page et recommence le patch.",
            };
          }
          if (error instanceof PageContentTooLong) {
            return { error: error.message };
          }
          throw error;
        }
      },
      inputSchema: documentPatchSchema,
    }),
    proposer_modification: tool({
      description:
        "Enregistre une proposition de patch sans modifier la page. L'utilisateur doit l'accepter. baseHash doit venir de lire_page.",
      execute: async (input) => {
        const current = await load();
        if (!current || current.userId !== params.userId) {
          return { error: "Page introuvable." };
        }
        const preview = applyDocumentPatch(current.content, {
          baseHash: input.baseHash,
          ops: input.ops,
        });
        if (!preview.ok) {
          return {
            baseHash: hashContent(current.content),
            error: patchError(preview),
          };
        }
        if (preview.content.length > current.content.length + 200_000) {
          return { error: "La proposition est trop longue." };
        }
        const proposal = await createPageProposal({
          baseHash: input.baseHash,
          description: input.description ?? null,
          ops: input.ops,
          pageId: current.id,
          userId: current.userId,
        });
        if (!proposal) {
          return { error: "La proposition n'a pas pu être enregistrée." };
        }
        notify(params.writer, {
          data: {
            baseHash: proposal.baseHash,
            createdAt: proposal.createdAt.toISOString(),
            description: proposal.description,
            id: proposal.id,
          },
          transient: true,
          type: "data-page-proposal",
        });
        return {
          description: proposal.description,
          proposalId: proposal.id,
          proposed: true,
        };
      },
      inputSchema: documentPatchSchema.extend({
        description: z.string().max(500).optional(),
      }),
    }),
    renommer_page: tool({
      description: "Renomme la page sans changer le corps Markdown.",
      execute: async ({ title }) => {
        const current = await load();
        if (!current || current.userId !== params.userId) {
          return { error: "Page introuvable." };
        }
        const nextTitle = title.trim().slice(0, PAGE_TITLE_MAX);
        if (!nextTitle) {
          return { error: "Le titre est vide." };
        }
        try {
          const updated = await updatePageContent({
            createdBy: params.userId,
            expectedRevision: current.revision,
            pageId: current.id,
            snapshot: "assistant",
            title: nextTitle,
            userId: current.userId,
          });
          if (!updated) {
            return { error: "Page introuvable." };
          }
          notify(params.writer, {
            data: {
              content: updated.content,
              revision: updated.revision,
              title: updated.title,
            } satisfies PageUpdatedEvent,
            transient: true,
            type: "data-page-updated",
          });
          return { renamed: true, title: updated.title };
        } catch (error) {
          if (error instanceof PageRevisionConflict) {
            return { error: "La page a changé. Relis-la avant de renommer." };
          }
          throw error;
        }
      },
      inputSchema: z.object({
        title: z.string().min(1).max(PAGE_TITLE_MAX),
      }),
    }),
  };
}
