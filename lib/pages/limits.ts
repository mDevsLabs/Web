// Plafonds techniques des pages mAI. Ils ne dépendent pas du forfait :
// le nombre de pages, lui, est dans lib/plans/tier-limits.ts.

/** Corps Markdown : même ordre de grandeur que les propositions d'artefacts. */
export const PAGE_CONTENT_MAX = 200_000;

export const PAGE_TITLE_MAX = 200;

/** Instantanés conservés par page. Au-delà, les plus anciens sont retirés. */
export const PAGE_REVISION_KEEP = 30;

export const PAGE_LIST_LIMIT = 200;

export const PAGE_MESSAGE_KEEP = 80;

export function pageContentTooLong(content: string): boolean {
  return content.length > PAGE_CONTENT_MAX;
}
