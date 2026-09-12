import { NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getScheduledMessageById } from "@/lib/db/queries";
import { executeScheduledMessage } from "@/lib/planning/executor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { id } = await params;
  const userId = user.id || user.email;

  const item = await getScheduledMessageById({ id, userId });
  if (!item) {
    return errorResponse("not_found", {
      message: "Message planifié introuvable.",
    });
  }

  try {
    const result = await executeScheduledMessage(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logError("Erreur exécution message planifié", error);
    return errorResponse("internal_error", {
      message: "Erreur lors de l'exécution du message planifié.",
    });
  }
}
