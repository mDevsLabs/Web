import { getMaiUser } from "@/lib/auth/session";
import { getChatById, getStreamIdsByChatId } from "@/lib/db/queries";

import { getStreamContext } from "@/app/(chat)/api/chat/route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;

  const maiUser = await getMaiUser();
  if (!maiUser?.id) {
    return new Response(null, { status: 401 });
  }

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return new Response(null, { status: 404 });
  }
  const userId = maiUser.id || maiUser.email;
  if (chat.userId !== userId && chat.userId !== maiUser.email) {
    return new Response(null, { status: 403 });
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
    return new Response(null, { status: 500 });
  }
}
