import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { duplicateSkill } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const userId = user.id || user.email;
  const { id } = await params;

  const duplicated = await duplicateSkill({ id, userId });
  if (!duplicated) {
    return errorResponse("not_found", {
      message: "Impossible de dupliquer le skill (introuvable).",
    });
  }

  return Response.json(duplicated, { status: 201 });
}
