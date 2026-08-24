import { z } from "zod";
import { getMaiUser } from "@/lib/auth/session";
import {
  getChatById,
  updateChatProjectById,
  updateChatArchivedById,
  updateChatPinnedById,
  updateChatTagsById,
  updateChatTitleById,
  updateChatVisibilityById,
  updateChatCustomInstructionsById,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  projectId: z.string().uuid().nullable().optional(),
  isArchived: z.boolean().optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  customInstructions: z.string().max(4000).nullable().optional(),
  modeId: z.string().max(20).nullable().optional(),
  temperatureOverride: z.number().min(0).max(2).nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const chat = await getChatById({ id });
  if (!chat) return new ChatbotError("not_found:database").toResponse();
  const userId = user.id || user.email;
  if (chat.userId !== userId && chat.userId !== user.email) {
    return new ChatbotError("forbidden:chat").toResponse();
  }
  return Response.json(chat);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getMaiUser();
  if (!user) return new ChatbotError("unauthorized:chat").toResponse();
  const userId = user.id || user.email;
  const chat = await getChatById({ id });
  if (!chat) return new ChatbotError("not_found:database").toResponse();
  if (chat.userId !== userId && chat.userId !== user.email) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.title !== undefined) {
      await updateChatTitleById({ chatId: id, title: parsed.title });
    }
    if (parsed.visibility !== undefined) {
      await updateChatVisibilityById({ chatId: id, visibility: parsed.visibility });
    }
    if (parsed.projectId !== undefined) {
      await updateChatProjectById({ chatId: id, userId, projectId: parsed.projectId });
    }
    if (parsed.isArchived !== undefined) {
      await updateChatArchivedById({ chatId: id, userId, isArchived: parsed.isArchived });
    }
    if (parsed.pinned !== undefined) {
      await updateChatPinnedById({ chatId: id, userId, pinned: parsed.pinned });
    }
    if (parsed.tags !== undefined) {
      await updateChatTagsById({ chatId: id, userId, tags: parsed.tags });
    }
    if (
      parsed.customInstructions !== undefined ||
      parsed.modeId !== undefined ||
      parsed.temperatureOverride !== undefined
    ) {
      await updateChatCustomInstructionsById({
        chatId: id,
        userId,
        customInstructions: parsed.customInstructions ?? undefined,
        modeId: parsed.modeId ?? undefined,
        temperatureOverride: parsed.temperatureOverride ?? undefined,
      });
    }

    const updated = await getChatById({ id });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof ChatbotError) return error.toResponse();
    if (error instanceof z.ZodError) {
      return new ChatbotError("bad_request:api", error.message).toResponse();
    }
    console.error("PATCH chat error:", error);
    return new ChatbotError("bad_request:database").toResponse();
  }
}
