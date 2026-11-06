import { z } from "zod";
import { errorResponse } from "@/lib/api/error-response";
import { getUserPreferences } from "@/lib/db/queries";
import {
  countPagesByOwner,
  createPage,
  getPageById,
  listPages,
} from "@/lib/db/queries/pages";
import { resolveNewPageDefaults } from "@/lib/pages/defaults";
import { pageErrorResponse, requirePageSession } from "@/lib/pages/http";
import { isPageAuthor } from "@/lib/pages/identity";
import { PAGE_CONTENT_MAX, PAGE_TITLE_MAX } from "@/lib/pages/limits";
import { canAttachPage, canDetachPage } from "@/lib/pages/permissions";
import { presentSummary } from "@/lib/pages/present";
import {
  getTierPageLimit,
  isPageQuotaExceeded,
  pageQuotaMessage,
} from "@/lib/plans/tier-limits";
import { getProjectAccess } from "@/lib/projects/access";

const createSchema = z.object({
  content: z.string().max(PAGE_CONTENT_MAX).optional(),
  duplicateOf: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  title: z.string().max(PAGE_TITLE_MAX).optional(),
});

export async function GET(request: Request) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const { searchParams } = new URL(request.url);
    const rawProject = searchParams.get("projectId");
    const query = searchParams.get("q") ?? undefined;
    let scope: "owned" | "project" | "unassigned" = "owned";
    let projectId: string | undefined;
    let projectRole: "member" | "owner" | null = null;

    if (rawProject === "none") {
      scope = "unassigned";
    } else if (rawProject) {
      if (!z.string().uuid().safeParse(rawProject).success) {
        return errorResponse("invalid_request", {
          message: "Identifiant de projet invalide.",
        });
      }
      const access = await getProjectAccess({
        projectId: rawProject,
        userEmail: auth.email,
        userId: auth.userId,
      });
      if (!access) {
        return errorResponse("not_found", { message: "Projet introuvable." });
      }
      scope = "project";
      projectId = rawProject;
      projectRole = access.role;
    }

    const [rows, used] = await Promise.all([
      listPages({
        ownerIds: auth.ownerIds,
        projectId,
        query,
        scope,
      }),
      countPagesByOwner(auth.ownerIds),
    ]);

    return Response.json({
      limit: getTierPageLimit(auth.session.user.tier),
      pages: rows.map((row) =>
        presentSummary(
          row,
          { email: auth.email, userId: auth.userId },
          {
            canDetach: canDetachPage({
              hasProject: Boolean(row.projectId),
              pageRole: isPageAuthor(row.userId, auth.userId, auth.email)
                ? "author"
                : "viewer",
              projectRole:
                scope === "project" && row.projectId === projectId
                  ? projectRole
                  : null,
            }),
          }
        )
      ),
      used,
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePageSession();
    if ("error" in auth) {
      return auth.error;
    }
    const body = createSchema.parse(await request.json().catch(() => ({})));
    const used = await countPagesByOwner(auth.ownerIds);
    const limit = getTierPageLimit(auth.session.user.tier);
    if (isPageQuotaExceeded(auth.session.user.tier, used)) {
      return errorResponse("quota_exceeded", {
        details: { limit, used },
        message: pageQuotaMessage(limit ?? used),
      });
    }

    let content = body.content ?? "";
    let title = body.title?.trim() || "Sans titre";
    let projectId = body.projectId ?? null;
    let duplicate: {
      customPrompt: string | null;
      modelId: string | null;
    } | null = null;

    if (body.duplicateOf) {
      const source = await getPageById(body.duplicateOf);
      if (!source || !isPageAuthor(source.userId, auth.userId, auth.email)) {
        return errorResponse("not_found", { message: "Page introuvable." });
      }
      content = source.content;
      title = `Copie de ${source.title}`.slice(0, PAGE_TITLE_MAX);
      projectId = source.projectId;
      duplicate = {
        customPrompt: source.customPrompt,
        modelId: source.modelId,
      };
    }

    if (projectId) {
      const access = await getProjectAccess({
        projectId,
        userEmail: auth.email,
        userId: auth.userId,
      });
      if (
        !canAttachPage({
          isAuthor: true,
          projectRole: access?.role ?? null,
        })
      ) {
        return errorResponse("access_denied", {
          message: "Vous ne pouvez pas ajouter de page à ce projet.",
        });
      }
    }

    const preferences = await getUserPreferences(auth.userId);
    const defaults = resolveNewPageDefaults({
      duplicate,
      preferences,
    });
    const created = await createPage({
      content,
      customPrompt: defaults.customPrompt,
      modelId: defaults.modelId,
      projectId,
      title,
      userId: auth.userId,
    });
    if (!created) {
      return errorResponse("internal_error");
    }
    return Response.json({
      limit,
      page: presentSummary(
        { ...created, contentPreview: created.content, projectName: null },
        { email: auth.email, userId: auth.userId },
        { canDetach: Boolean(created.projectId) }
      ),
      used: used + 1,
    });
  } catch (error) {
    return pageErrorResponse(error);
  }
}
