import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { listerConversationsCoach } from "@/lib/quizzly/coach-store";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const conversations = await listerConversationsCoach(session.userId);
    return Response.json(
      {
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          intent: conversation.intent,
          pinned: conversation.pinned,
          title: conversation.title,
          updatedAt: conversation.updatedAt,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/coach/conversations", error);
    return errorResponse("database_error");
  }
}
