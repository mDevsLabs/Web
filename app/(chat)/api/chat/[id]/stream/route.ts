import { chatOwnerMatches } from "@/lib/agent/channel";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getStreamContext } from "@/lib/chat/stream-context";
import { getChatById, getStreamIdsByChatId } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;

  const maiUser = await getMaiUser();
  if (!maiUser?.id) {
    return errorResponse("auth_required");
  }

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return errorResponse("not_found", {
      message: "La discussion demandée est introuvable.",
    });
  }
  if (
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: maiUser.email,
      userId: maiUser.id,
      username: maiUser.username,
    })
  ) {
    return errorResponse("access_denied");
  }

  let streamIds: string[];
  try {
    streamIds = await getStreamIdsByChatId({ chatId });
  } catch {
    return new Response(null, { status: 204 });
  }

  const mostRecentStreamId = streamIds.at(-1);
  if (!mostRecentStreamId) {
    return new Response(null, { status: 204 });
  }

  const streamContext = getStreamContext();
  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  try {
    const stream = await streamContext.resumeExistingStream(mostRecentStreamId);
    if (!stream) {
      return new Response(null, { status: 204 });
    }
    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  } catch {
    return errorResponse("internal_error");
  }
}
