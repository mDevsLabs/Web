import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { updateSearchQueryVote } from "@/lib/db/queries/search-history";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      searchId?: string;
      vote?: string;
    };
    const { searchId, vote } = body;

    if (!searchId || (vote !== "good" && vote !== "bad")) {
      return errorResponse("invalid_request", {
        message: "Données invalides.",
        status: 400,
      });
    }

    const session = await requireUser();
    if (!session) {
      // Pour les sessions anonymes ou non enregistrées, on accepte le vote côté client
      return NextResponse.json({ recorded: false, success: true });
    }

    const updated = await updateSearchQueryVote(searchId, session.userId, vote);
    return NextResponse.json({ recorded: updated, success: true });
  } catch (error: unknown) {
    console.error("[mAI-Search-Vote] Erreur:", error);
    return errorResponse("internal_error", {
      message: "Impossible d'enregistrer le vote.",
      status: 500,
    });
  }
}
