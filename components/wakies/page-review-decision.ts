"use client";

import { api } from "@/components/wakies/api";
import type { Page } from "@/lib/wakies/pages";
import { pageReviewSchema } from "@/lib/wakies/shared/page-review";

const reviewPath = (conversationId: string) =>
  `/conversations/${encodeURIComponent(conversationId)}/reviewed-page`;

export function restorePageReview(conversationId: string, toolCallId: string) {
  return api<Page | null>(
    `${reviewPath(conversationId)}/${encodeURIComponent(toolCallId)}`
  );
}

export async function decidePageReview(
  conversationId: string,
  toolCallId: string,
  args: unknown,
  approved: boolean
): Promise<Page | null> {
  // A previous save may have committed even if its response never arrived.
  const previous = await restorePageReview(conversationId, toolCallId);
  if (previous) return previous;
  if (!approved) return null;
  const draft = pageReviewSchema.parse(args);
  return api<Page>(reviewPath(conversationId), "POST", {
    ...draft,
    toolCallId,
  });
}
