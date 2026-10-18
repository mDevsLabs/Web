import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { updateSearchQueryVote } from "@/lib/db/queries/search-history";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchId, vote } = body;

    if (!searchId || (vote !== "good" && vote !== "bad")) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const session = await requireUser();
    if (!session) {
      // Pour les sessions anonymes ou non enregistrées, on accepte le vote côté client
      return NextResponse.json({ recorded: false, success: true });
    }

    const updated = await updateSearchQueryVote(searchId, session.userId, vote);
    return NextResponse.json({ recorded: updated, success: true });
  } catch (error: any) {
    console.error("[mAI-Search-Vote] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer le vote" },
      { status: 500 }
    );
  }
}
