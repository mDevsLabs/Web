import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { parseHistoryQuery } from "@/lib/chat/history-query";
import {
  deleteAllChatsByUserId,
  getChatsByUserId,
  getProjectChatHistory,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const parsed = parseHistoryQuery(request.nextUrl.searchParams);
  if (!parsed.success) {
    return new ChatbotError("bad_request:api", parsed.message).toResponse();
  }
  const { project, endingBefore, limit, startingAfter, ...filters } =
    parsed.data;

  const session = await requireUser();

  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const { user, userId } = session;
  const page = { endingBefore, limit, startingAfter };

  try {
    // Espace projet partagé : quand un projectId est demandé, on renvoie les
    // conversations du projet (tous auteurs), après vérification du rôle
    // (owner ou membre). Sans projectId, l'historique reste strictement
    // personnel — les conversations des autres n'y remontent jamais.
    if (project.kind === "project") {
      const { getProjectAccess } = await import("@/lib/projects/access");
      const access = await getProjectAccess({
        projectId: project.id,
        userEmail: user.email,
        userId,
      });
      if (!access) {
        return new ChatbotError("not_found:database").toResponse();
      }
      return Response.json(
        await getProjectChatHistory({
          ...filters,
          ...page,
          projectId: project.id,
        })
      );
    }

    const chats = await getChatsByUserId({
      ...filters,
      ...page,
      id: userId,
      // « Sans projet » : filtre IS NULL ; sinon aucun filtre de projet.
      projectId: project.kind === "none" ? null : undefined,
      userEmail: user.email,
    });

    return Response.json(chats);
  } catch (error) {
    console.error("Erreur récupération historique:", error);
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return new ChatbotError("bad_request:database", {
      cause: error,
    }).toResponse();
  }
}

export async function DELETE() {
  try {
    const session = await requireUser();

    if (!session) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const result = await deleteAllChatsByUserId({
      userEmail: session.user.email,
      userId: session.userId,
    });

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("[history-api] DELETE error:", error);
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    return new ChatbotError("bad_request:database", {
      cause: error,
    }).toResponse();
  }
}
