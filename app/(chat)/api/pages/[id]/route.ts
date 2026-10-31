import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import {
  deletePage,
  detachPage,
  expireStaleProposals,
  listPageMessages,
  listPendingProposals,
  snapshotPage,
  updatePageContent,
  updatePageMeta,
} from "@/lib/db/queries/pages";
import { getPageAccess } from "@/lib/pages/access";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { PAGE_CONTENT_MAX, PAGE_TITLE_MAX } from "@/lib/pages/limits";
import {
  canAttachPage,
  canDeletePage,
  canEditPage,
} from "@/lib/pages/permissions";
import { presentDetail } from "@/lib/pages/present";
import {
  buildNullableCustomInstructionsSchema,
  customInstructionsLimitPayload,
} from "@/lib/plans/custom-instructions";
import { getProjectAccess } from "@/lib/projects/access";

type Params = { params: Promise<{ id: string }> };

function buildPatchSchema(tier: string | null | undefined) {
  return z.object({
    content: z.string().max(PAGE_CONTENT_MAX).optional(),
    customPrompt: buildNullableCustomInstructionsSchema(tier),
    modelId: z.string().max(120).nullable().optional(),
    projectId: z.string().uuid().nullable().optional(),
    revision: z.number().int().positive().optional(),
    snapshot: z.boolean().optional(),
    title: z.string().max(PAGE_TITLE_MAX).optional(),
  });
}

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
    if (!access) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const author = canEditPage(access.role);
    if (author) {
      await expireStaleProposals(access.page.id, access.page.content);
    }
    const [messages, pending] = author
      ? await Promise.all([
          listPageMessages(access.page.id),
          listPendingProposals(access.page.id),
        ])
      : [[], []];
    return Response.json({
      page: presentDetail({
        canDetach: access.canDetach,
        content: access.page.content,
        createdAt: access.page.createdAt,
        customPrompt: access.page.customPrompt,
        id: access.page.id,
        messages,
        modelId: access.page.modelId,
        pending,
        projectId: access.page.projectId,
        projectName: access.projectName,
        revision: access.page.revision,
        role: access.role,
        title: access.page.title,
        updatedAt: access.page.updatedAt,
        userId: access.page.userId,
        viewer: { email: auth.email, userId: auth.userId },
      }),
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
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
    if (!access) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    const body = buildPatchSchema(auth.session.user.tier).parse(
      await request.json().catch(() => ({}))
    );
    const editsContent =
      body.content !== undefined || body.title !== undefined || body.snapshot;
    const editsMeta =
      body.customPrompt !== undefined || body.modelId !== undefined;
    const editsProject = body.projectId !== undefined;
    if ((editsContent || editsMeta) && !canEditPage(access.role)) {
      return errorResponse("access_denied", {
        message: "Seul l'auteur peut modifier cette page.",
      });
    }
    if (
      body.customPrompt &&
      customInstructionsLimitPayload(
        auth.session.user.tier,
        body.customPrompt.length
      )
    ) {
      const payload = customInstructionsLimitPayload(
        auth.session.user.tier,
        body.customPrompt.length
      );
      if (payload) {
        return errorResponse("invalid_request", payload);
      }
    }

    let current = access.page;
    if (editsProject && body.projectId === null) {
      if (!access.canDetach) {
        return errorResponse("access_denied", {
          message: "Vous ne pouvez pas détacher cette page.",
        });
      }
      const detached = await detachPage(current.id);
      if (!detached) {
        return errorResponse("not_found", { message: "Page introuvable." });
      }
      current = detached;
    } else if (editsProject && body.projectId) {
      if (!canEditPage(access.role)) {
        return errorResponse("access_denied");
      }
      const projectAccess = await getProjectAccess({
        projectId: body.projectId,
        userEmail: auth.email,
        userId: auth.userId,
      });
      if (
        !canAttachPage({
          isAuthor: true,
          projectRole: projectAccess?.role ?? null,
        })
      ) {
        return errorResponse("access_denied", {
          message: "Vous ne pouvez pas ajouter de page à ce projet.",
        });
      }
      const attached = await updatePageMeta({
        id: current.id,
        projectId: body.projectId,
        userId: current.userId,
      });
      if (!attached) {
        return errorResponse("not_found", { message: "Page introuvable." });
      }
      current = attached;
    }

    if (body.content !== undefined || body.title !== undefined) {
      if (body.revision === undefined) {
        return errorResponse("invalid_request", {
          message: "La révision attendue est requise.",
        });
      }
      const updated = await updatePageContent({
        content: body.content,
        createdBy: auth.userId,
        expectedRevision: body.revision,
        pageId: current.id,
        snapshot: body.snapshot ? "manual" : null,
        title: body.title,
        userId: current.userId,
      });
      if (!updated) {
        return errorResponse("not_found", { message: "Page introuvable." });
      }
      current = updated;
    } else if (body.snapshot) {
      await snapshotPage({
        createdBy: auth.userId,
        pageId: current.id,
        source: "manual",
        userId: current.userId,
      });
    }

    if (editsMeta) {
      const updated = await updatePageMeta({
        customPrompt:
          body.customPrompt === undefined
            ? undefined
            : body.customPrompt?.trim() || null,
        id: current.id,
        modelId:
          body.modelId === undefined ? undefined : body.modelId?.trim() || null,
        userId: current.userId,
      });
      if (updated) {
        current = updated;
      }
    }

    const fresh = await getPageAccess({
      pageId: current.id,
      userEmail: auth.email,
      userId: auth.userId,
    });
    if (!fresh) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    return Response.json({
      page: presentDetail({
        canDetach: fresh.canDetach,
        content: fresh.page.content,
        createdAt: fresh.page.createdAt,
        customPrompt: fresh.page.customPrompt,
        id: fresh.page.id,
        messages: [],
        modelId: fresh.page.modelId,
        pending: [],
        projectId: fresh.page.projectId,
        projectName: fresh.projectName,
        revision: fresh.page.revision,
        role: fresh.role,
        title: fresh.page.title,
        updatedAt: fresh.page.updatedAt,
        userId: fresh.page.userId,
        viewer: { email: auth.email, userId: auth.userId },
      }),
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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
    if (!access || !canDeletePage(access.role)) {
      return errorResponse("not_found", { message: "Page introuvable." });
    }
    await deletePage({ id: access.page.id, userId: access.page.userId });
    return Response.json({ success: true });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
