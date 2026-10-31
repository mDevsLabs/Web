import type { PageMessage, PageProposal } from "@/lib/db/schema";
import { isPageAuthor } from "@/lib/pages/identity";
import { countWords, pageExcerpt } from "@/lib/pages/text";
import type {
  PageDetail,
  PageMessageView,
  PageProposalView,
  PageRevisionView,
  PageSummary,
} from "@/lib/pages/types";

function iso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export function presentSummary(
  row: {
    contentPreview?: string | null;
    id: string;
    projectId: string | null;
    projectName?: string | null;
    revision: number;
    title: string;
    updatedAt: Date | string;
    userId: string;
  },
  viewer: { email?: string | null; userId: string },
  extras?: { canDetach?: boolean; projectName?: string | null }
): PageSummary {
  return {
    canDetach: extras?.canDetach ?? false,
    canEdit: isPageAuthor(row.userId, viewer.userId, viewer.email),
    excerpt: pageExcerpt(row.contentPreview ?? ""),
    id: row.id,
    projectId: row.projectId,
    projectName: extras?.projectName ?? row.projectName ?? null,
    revision: row.revision,
    title: row.title,
    updatedAt: iso(row.updatedAt),
  };
}

export function presentMessages(rows: PageMessage[]): PageMessageView[] {
  return rows.flatMap((row) => {
    if (
      row.role !== "user" &&
      row.role !== "assistant" &&
      row.role !== "system"
    ) {
      return [];
    }
    return [
      {
        id: row.id,
        parts: Array.isArray(row.parts) ? row.parts : [],
        role: row.role,
      },
    ];
  });
}

export function presentProposals(rows: PageProposal[]): PageProposalView[] {
  return rows.map((row) => ({
    baseHash: row.baseHash,
    createdAt: iso(row.createdAt),
    description: row.description,
    id: row.id,
  }));
}

export function presentRevisions(
  rows: Array<{
    createdAt: Date | string;
    id: string;
    source: string;
    title: string;
  }>
): PageRevisionView[] {
  return rows.flatMap((row) => {
    if (
      row.source !== "manual" &&
      row.source !== "assistant" &&
      row.source !== "restore"
    ) {
      return [];
    }
    return [
      {
        createdAt: iso(row.createdAt),
        id: row.id,
        source: row.source,
        title: row.title,
      },
    ];
  });
}

export function presentDetail(params: {
  canDetach: boolean;
  content: string;
  createdAt: Date | string;
  customPrompt: string | null;
  id: string;
  messages: PageMessage[];
  modelId: string | null;
  pending: PageProposal[];
  projectId: string | null;
  projectName: string | null;
  revision: number;
  role: "author" | "viewer";
  title: string;
  updatedAt: Date | string;
  userId: string;
  viewer: { email?: string | null; userId: string };
}): PageDetail {
  const author = params.role === "author";
  const summary = presentSummary(
    {
      contentPreview: params.content,
      id: params.id,
      projectId: params.projectId,
      projectName: params.projectName,
      revision: params.revision,
      title: params.title,
      updatedAt: params.updatedAt,
      userId: params.userId,
    },
    params.viewer,
    { canDetach: params.canDetach, projectName: params.projectName }
  );
  return {
    ...summary,
    content: params.content,
    createdAt: iso(params.createdAt),
    customPrompt: author ? params.customPrompt : null,
    messages: author ? presentMessages(params.messages) : [],
    modelId: author ? params.modelId : null,
    pendingProposals: author ? presentProposals(params.pending) : [],
    wordCount: countWords(params.content),
  };
}
