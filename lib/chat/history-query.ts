import { z } from "zod";

export const HISTORY_DEFAULT_LIMIT = 20;
export const HISTORY_MAX_LIMIT = 50;

/** `all` : aucun filtre ; `none` : sans projet ; `project` : un projet précis. */
export type HistoryProjectFilter =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "project"; id: string };

const triState = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => (value === undefined ? null : value === "true"));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

const historyQuerySchema = z
  .object({
    ending_before: z.guid().optional(),
    includeArchived: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    isArchived: triState,
    // Les valeurs hors bornes restent bornées (compatibilité des clients) ;
    // seule une valeur non entière est refusée.
    limit: z
      .string()
      .regex(/^\d+$/, "La limite doit être un entier positif.")
      .optional()
      .transform((value) => {
        const requested =
          value === undefined
            ? HISTORY_DEFAULT_LIMIT
            : Number.parseInt(value, 10);
        return Math.min(Math.max(requested, 1), HISTORY_MAX_LIMIT);
      }),
    pinned: triState,
    // Le filtre « Sans projet » de la page Projets envoie `projectId=null`.
    projectId: z
      .union([z.literal("null"), z.literal(""), z.guid()])
      .optional()
      .transform((value): HistoryProjectFilter => {
        if (value === undefined) {
          return { kind: "all" };
        }
        if (value === "null" || value === "") {
          return { kind: "none" };
        }
        return { id: value, kind: "project" };
      }),
    search: optionalText(200),
    starting_after: z.guid().optional(),
    tag: optionalText(100),
  })
  .refine((query) => !(query.starting_after && query.ending_before), {
    message: "Un seul curseur est accepté : starting_after ou ending_before.",
  });

export interface HistoryQuery {
  endingBefore: string | null;
  includeArchived: boolean;
  isArchived: boolean | null;
  limit: number;
  pinned: boolean | null;
  project: HistoryProjectFilter;
  search: string | null;
  startingAfter: string | null;
  tag: string | null;
}

export type HistoryQueryResult =
  | { success: true; data: HistoryQuery }
  | { success: false; message: string };

export function parseHistoryQuery(
  searchParams: URLSearchParams
): HistoryQueryResult {
  const result = historyQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!result.success) {
    return {
      message:
        result.error.issues[0]?.message ?? "Paramètres d'historique invalides.",
      success: false,
    };
  }
  const query = result.data;
  return {
    data: {
      endingBefore: query.ending_before ?? null,
      includeArchived: query.includeArchived,
      isArchived: query.isArchived,
      limit: query.limit,
      pinned: query.pinned,
      project: query.projectId,
      search: query.search,
      startingAfter: query.starting_after ?? null,
      tag: query.tag,
    },
    success: true,
  };
}
