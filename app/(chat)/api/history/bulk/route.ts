import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import { bulkUpdateChats, deleteAllChatsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const bulkSchema = z.object({
  action: z.enum(["move", "archive", "unarchive", "pin", "unpin", "tag", "delete"]),
  chatIds: z.array(z.string().uuid()).min(1).max(100),
  projectId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getMaiUser();
    if (!user) return new ChatbotError("unauthorized:chat").toResponse();
    const userId = user.id || user.email;
    const body = await request.json();
    const parsed = bulkSchema.parse(body);

    const result = await bulkUpdateChats({
      action: parsed.action,
      chatIds: parsed.chatIds,
      projectId: parsed.projectId ?? null,
      tags: parsed.tags,
      userId,
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ChatbotError) return error.toResponse();
    if (error instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", error.message).toResponse();
    }
    console.error("Bulk history error:", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

// DELETE all with optional filters? Keep simple: delete all non-archived or all
export async function DELETE(request: Request) {
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const isArchived = searchParams.get("isArchived");

  // For now, only support deleteAll (existing behavior) + project scoped delete via bulk
  if (projectId || isArchived) {
    // Use bulk delete with query
    const { getChatsByUserId } = await import("@/lib/db/queries");
    const { chats } = await getChatsByUserId({
      id: userId,
      limit: 100,
      startingAfter: null,
      endingBefore: null,
      projectId: projectId ?? undefined,
      isArchived: isArchived === "true" ? true : isArchived === "false" ? false : undefined,
      includeArchived: true,
    });
    const ids = chats.map((c) => c.id);
    if (ids.length === 0) return Response.json({ deletedCount: 0 });
    const { bulkUpdateChats } = await import("@/lib/db/queries");
    await bulkUpdateChats({ userId, chatIds: ids, action: "delete" });
    return Response.json({ deletedCount: ids.length });
  }

  const result = await deleteAllChatsByUserId({ userId });
  return Response.json(result, { status: 200 });
}
