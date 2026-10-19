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

/**
 * Réglages de lecture d'une page. Volontairement court, et chaque clé change
 * réellement l'affichage : un réglage que rien ne lit est un mensonge
 * d'interface. Le titre reste toujours modifiable dans le document.
 */
export const pageSettings = z
  .object({
    /** Signe affiché à la place de l'icône de page dans la bibliothèque. */
    icon: z.string().trim().max(16).nullable().default(null),
    /** Colonne de lecture élargie, à la largeur de la bibliothèque. */
    large: z.boolean().default(false),
  })
  .strict();

export type PageSettings = z.infer<typeof pageSettings>;

export const pageInput = z
  .object({
    content: z.string().max(100_000).default(""),
    parentId: z.string().min(1).nullable().default(null),
    title: z.string().trim().min(1).max(160),
  })
  .strict();

/**
 * `.strict()` est un contrat : une clé non déclarée répond 400.
 *
 * Le PATCH porte ce qui EST le document — titre, contenu, parent — et fait
 * varier la révision. L'épingle et les réglages de lecture ont leur route
 * (`/pages/:id/pin`, `/pages/:id/settings`) et n'entrent pas ici : les écrire
 * par le PATCH ferait bondir la révision derrière le dos de l'onglet ouvert sur
 * la page, qui perdrait son brouillon en 409 à la prochaine sauvegarde.
 */
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
  pinned: boolean;
  revision: number;
  settings: PageSettings | null;
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
