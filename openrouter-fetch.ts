import { getDb } from "./config.ts";
import {
  ModelAccessError,
  requireChatModel,
  type SqlClient,
  validateModelRequest,
} from "./openrouter-models.ts";

// Les services internes Vibe utilisent le même état d'activation que l'API publique.
// Leurs règles de forfait sont déjà appliquées par leurs handlers.
export async function fetchOpenRouter(
  url: string,
  init: RequestInit,
  sql: SqlClient = getDb()
): Promise<Response> {
  try {
    if (typeof init.body !== "string") {
      throw new ModelAccessError(
        400,
        "invalid_request_body",
        "Un corps JSON est requis."
      );
    }
    const body = JSON.parse(init.body);
    const model = await requireChatModel(sql, body.model, true);
    validateModelRequest(body, model);
    return await fetch(url, init);
  } catch (error) {
    if (!(error instanceof ModelAccessError)) throw error;
    return Response.json(
      { error: { code: error.code, message: error.message } },
      {
        status: error.status,
      }
    );
  }
}
