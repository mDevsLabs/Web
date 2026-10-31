import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import {
  assurerSiege,
  cloreLiguesEchues,
  lireCohorte,
} from "@/lib/quizzly/league-store";
import { portraitsPour } from "@/lib/quizzly/portraits";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    await cloreLiguesEchues();
    await assurerSiege(session.userId);
    const cohorte = await lireCohorte(session.userId);
    if (!cohorte) {
      return errorResponse("database_error", {
        message: "La ligue n'a pas de siège pour cette semaine.",
      });
    }
    const portraits = await portraitsPour(
      cohorte.lignes.map((ligne) => ligne.userId)
    );
    return Response.json(
      {
        league: cohorte.league,
        lignes: cohorte.lignes.map((ligne) => {
          const portrait = portraits.get(ligne.userId);
          return {
            avatarUrl: portrait?.avatarUrl ?? null,
            displayName: portrait?.displayName ?? "Élève",
            me: ligne.userId === session.userId,
            rank: ligne.rank,
            username: portrait?.username ?? "",
            weeklyXp: ligne.weeklyXp,
          };
        }),
        weekKey: cohorte.weekKey,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/ligues", error);
    return errorResponse("database_error");
  }
}
