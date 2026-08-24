import type { NextRequest } from "next/server";
import { getMaiUser } from "@/lib/auth/session";
import { deleteAllChatsByUserId, getChatsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") || "20", 10), 1),
    50
  );
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");
  const projectId = searchParams.get("projectId");
  const isArchivedParam = searchParams.get("isArchived");
  const includeArchived = searchParams.get("includeArchived") === "true";
  const pinnedParam = searchParams.get("pinned");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  if (startingAfter && endingBefore) {
    return new ChatbotError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const user = await getMaiUser();

  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const userId = user.id || user.email;

  const isArchived = isArchivedParam === "true" ? true : isArchivedParam === "false" ? false : null;
  const pinned = pinnedParam === "true" ? true : pinnedParam === "false" ? false : null;

  const chats = await getChatsByUserId({
    endingBefore,
    id: userId,
    includeArchived,
    isArchived,
    limit,
    pinned,
    projectId: projectId ?? undefined,
    search: search ?? null,
    startingAfter,
    tag: tag ?? null,
    userEmail: user.email,
  });

  return Response.json(chats);
}

export async function DELETE() {
  const user = await getMaiUser();

  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const userId = user.id || user.email;
  const result = await deleteAllChatsByUserId({ userId });

  return Response.json(result, { status: 200 });
}
