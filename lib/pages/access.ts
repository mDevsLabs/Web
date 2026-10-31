import "server-only";

import { getPageById } from "@/lib/db/queries/pages";
import { isPageAuthor } from "@/lib/pages/identity";
import { canDetachPage, type PageRole } from "@/lib/pages/permissions";
import { getProjectAccess } from "@/lib/projects/access";
import type { ProjectRole } from "@/lib/projects/permissions";

export type PageAccess = {
  canDetach: boolean;
  page: NonNullable<Awaited<ReturnType<typeof getPageById>>>;
  projectInstructions: string | null;
  projectName: string | null;
  projectRole: ProjectRole | null;
  role: PageRole;
};

export async function getPageAccess(params: {
  pageId: string;
  userEmail?: string | null;
  userId: string;
}): Promise<PageAccess | null> {
  const row = await getPageById(params.pageId);
  if (!row) {
    return null;
  }
  let projectRole: ProjectRole | null = null;
  let projectName: string | null = null;
  let projectInstructions: string | null = null;
  if (row.projectId) {
    const projectAccess = await getProjectAccess({
      projectId: row.projectId,
      userEmail: params.userEmail,
      userId: params.userId,
    });
    projectRole = projectAccess?.role ?? null;
    projectName = projectAccess?.project.name ?? null;
    projectInstructions = projectAccess?.project.customInstructions ?? null;
  }
  const author = isPageAuthor(row.userId, params.userId, params.userEmail);
  const role: PageRole | null = author
    ? "author"
    : projectRole
      ? "viewer"
      : null;
  if (!role) {
    return null;
  }
  return {
    canDetach: canDetachPage({
      hasProject: Boolean(row.projectId),
      pageRole: role,
      projectRole,
    }),
    page: row,
    projectInstructions,
    projectName,
    projectRole,
    role,
  };
}
