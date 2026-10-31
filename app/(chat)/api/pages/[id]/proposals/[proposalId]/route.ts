import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { hashContent } from "@/lib/artifacts/hash";
import { applyDocumentPatch, documentPatchSchema } from "@/lib/artifacts/patch";
import {
  getPageProposal,
  resolvePageProposal,
  updatePageContent,
} from "@/lib/db/queries/pages";
import { getPageAccess } from "@/lib/pages/access";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { canEditPage } from "@/lib/pages/permissions";

type Params = { params: Promise<{ id: string; proposalId: string }> };

const actionSchema = z.object({
  action: z.enum(["accept", "reject"]),
  revision: z.number().int().positive().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const { id, proposalId } = await params;
    const access = await getPageAccess({
      pageId: id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!access || !canEditPage(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const proposal = await getPageProposal({
      id: proposalId,
      pageId: access.page.id,
    });
    if (proposal?.status !== "pending") {
      return errorResponse("not_found", {
        message: "Proposition introuvable.",
      });
    }
    const body = actionSchema.parse(await request.json().catch(() => ({})));
    if (body.action === "reject") {
      await resolvePageProposal({ id: proposal.id, status: "rejected" });
      return Response.json({ status: "rejected" });
    }
    if (body.revision === undefined) {
      return errorResponse("invalid_request", {
        message: "La révision attendue est requise.",
      });
    }
    const parsed = documentPatchSchema.safeParse({
      baseHash: proposal.baseHash,
      ops: proposal.ops,
    });
    if (!parsed.success) {
      await resolvePageProposal({ id: proposal.id, status: "stale" });
      return errorResponse("conflict", {
        message: "Cette proposition n'est plus applicable.",
      });
    }
    if (proposal.baseHash !== hashContent(access.page.content)) {
      await resolvePageProposal({ id: proposal.id, status: "stale" });
      return errorResponse("conflict", {
        message: "La page a changé depuis cette proposition.",
      });
    }
    const applied = applyDocumentPatch(access.page.content, parsed.data);
    if (!applied.ok) {
      await resolvePageProposal({ id: proposal.id, status: "stale" });
      return errorResponse("conflict", {
        message: applied.errors.map((error) => error.message).join(" "),
      });
    }
    const updated = await updatePageContent({
      content: applied.content,
      createdBy: auth.userId,
      expectedRevision: body.revision,
      pageId: access.page.id,
      snapshot: "assistant",
      userId: access.page.userId,
    });
    if (!updated) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    await resolvePageProposal({ id: proposal.id, status: "accepted" });
    return Response.json({
      page: {
        content: updated.content,
        revision: updated.revision,
        title: updated.title,
      },
      status: "accepted",
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
