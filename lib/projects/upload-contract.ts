/**
 * Contrat de réponse de `POST /cloud/upload` (backend Val Town).
 *
 * La réponse réelle est `{ file: { id, url, … }, storage, success }`. Le
 * client upstream est partagé par d'autres routes : on ne l'aplatit pas, on
 * valide ici la forme attendue. Une réponse incomplète doit être refusée —
 * jamais convertie en pièce jointe à URL vide et référence perdue.
 */

import { z } from "zod";

const uploadedFileSchema = z
  .object({
    id: z.string().min(1),
    url: z.string().min(1),
  })
  .passthrough();

const uploadResponseSchema = z
  .object({
    file: uploadedFileSchema.optional(),
    file_id: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
  })
  .passthrough();

export type ProjectUploadRef = { id: string; url: string };

export function parseProjectUploadResponse(
  payload: unknown
): ProjectUploadRef | null {
  const parsed = uploadResponseSchema.safeParse(payload);
  if (!parsed.success) return null;
  const file = parsed.data.file;
  const id = file?.id || parsed.data.id || parsed.data.file_id;
  const url = file?.url || parsed.data.url;
  if (!id || !url) return null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }
  } catch {
    return null;
  }
  return { id, url };
}
