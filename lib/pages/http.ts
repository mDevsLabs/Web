import "server-only";

import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import {
  PageContentTooLong,
  PageRevisionConflict,
} from "@/lib/db/queries/pages";
import { ChatbotError } from "@/lib/errors";
import { pageOwnerIds } from "@/lib/pages/identity";

export async function requirePageSession() {
  const session = await requireUser();
  if (!session) {
    return { error: errorResponse("auth_required") } as const;
  }
  return {
    email: session.user.email,
    ownerIds: pageOwnerIds(session.userId, session.user.email),
    session,
    userId: session.userId,
  } as const;
}

export function pageErrorResponse(error: unknown): Response {
  if (error instanceof PageRevisionConflict) {
    return errorResponse("conflict", { message: error.message });
  }
  if (error instanceof PageContentTooLong) {
    return errorResponse("payload_too_large", { message: error.message });
  }
  if (error instanceof z.ZodError) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(error),
    });
  }
  if (error instanceof ChatbotError) {
    return error.toResponse();
  }
  console.error("[pages]", error);
  return errorResponse("internal_error");
}
