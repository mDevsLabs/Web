import { z } from "zod";

import { API_ERROR_CODES } from "@/lib/api/error-codes";

// Enveloppe d'erreur unifiée du BFF mAI :
// { code, message, status, details? } — message toujours en français.
export const apiErrorSchema = z.object({
  code: z.enum(API_ERROR_CODES),
  details: z.unknown().optional(),
  message: z.string(),
  status: z.number().int(),
});

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return apiErrorSchema.safeParse(value).success;
}
