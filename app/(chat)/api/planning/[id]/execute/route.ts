import { NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { getScheduledMessageById } from "@/lib/db/queries";
import { executeScheduledMessage } from "@/lib/planning/executor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // `requireUser` dérive l'identité canonique (`id || email`) ; cette route
  // lisait `user.id` seul et rejetait les comptes dont l'identifiant
  // persistant est l'adresse.
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required", { message: "Non autorisé." });
  }

  const { id } = await params;
  const item = await getScheduledMessageById({ id, userId: session.userId });
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
