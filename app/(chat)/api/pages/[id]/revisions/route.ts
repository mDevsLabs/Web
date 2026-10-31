import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  getPageRevision,
  listPageRevisions,
  snapshotPage,
  updatePageContent,
} from "@/lib/db/queries/pages";
import { getPageAccess } from "@/lib/pages/access";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { canEditPage } from "@/lib/pages/permissions";
import { presentRevisions } from "@/lib/pages/present";

type Params = { params: Promise<{ id: string }> };

const restoreSchema = z.object({
  restoreId: z.string().uuid().optional(),
  revision: z.number().int().positive().optional(),
});

export async function GET(_request: Request, { params }: Params) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const { id } = await params;
    const access = await getPageAccess({
      pageId: id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!access || !canEditPage(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const rows = await listPageRevisions(access.page.id);
    return Response.json({ revisions: presentRevisions(rows) });
  } catch (error) {
    return pageErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const { id } = await params;
    const access = await getPageAccess({
      pageId: id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!access || !canEditPage(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const body = restoreSchema.parse(await request.json().catch(() => ({})));
    if (!body.restoreId) {
      const saved = await snapshotPage({
        createdBy: auth.userId,
        pageId: access.page.id,
        source: "manual",
        userId: access.page.userId,
      });
      if (!saved) {
        return errorResponse("not_found", { message: "Page introuvable." });
      }
      return Response.json({
        revision: {
          createdAt: saved.createdAt.toISOString(),
          id: saved.id,
          source: saved.source,
          title: saved.title,
        },
      });
    }
    if (body.revision === undefined) {
      return errorResponse("invalid_request", {
        message: "La révision attendue est requise.",
      });
    }
    const stored = await getPageRevision({
      id: body.restoreId,
      pageId: access.page.id,
    });
    if (!stored) {
      return errorResponse("not_found", { message: "Version introuvable." });
    }
    const updated = await updatePageContent({
      content: stored.content,
      createdBy: auth.userId,
      expectedRevision: body.revision,
      pageId: access.page.id,
      snapshot: "restore",
      title: stored.title,
      userId: access.page.userId,
    });
    if (!updated) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    return Response.json({
      page: {
        content: updated.content,
        revision: updated.revision,
        title: updated.title,
      },
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
