/**
 * Schémas de validation des pages Wakies, partagés par l'interface et les
 * routes BFF.
 *
 * Dans le gabarit d'origine, ces schémas vivaient dans `src/server/pages.ts`,
 * à côté de la classe `Pages` adossée à SQLite. Le port les sépare de leur
 * stockage : seule la validation pure est partagée, la persistance est
 * réécrite sur Postgres (`lib/wakies/queries.ts`).
 */
import { z } from "zod";

export const pageInput = z
  .object({
    content: z.string().max(100_000).default(""),
    parentId: z.string().min(1).nullable().default(null),
    title: z.string().trim().min(1).max(160),
  })
  .strict();

export const pagePatch = z
  .object({
    content: z.string().max(100_000).optional(),
    expectedRevision: z.number().int().positive(),
    parentId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).max(160).optional(),
  })
  .strict();

export interface Page {
  content: string;
  createdAt: number;
  id: string;
  parentId: string | null;
  revision: number;
  sourceThreadId: string | null;
  spaceId: string;
  title: string;
  updatedAt: number;
}

/**
 * Erreur métier de l'espace de pages : le statut HTTP est porté par l'erreur
 * pour que la route BFF n'ait plus qu'à le recopier tel quel.
 */
export class PageError extends Error {
  readonly status: 400 | 404 | 409;

  constructor(message: string, status: 400 | 404 | 409 = 400) {
    super(message);
    this.status = status;
  }
}
