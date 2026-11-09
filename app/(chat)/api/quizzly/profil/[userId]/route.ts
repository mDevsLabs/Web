import { and, eq } from "drizzle-orm";
import { errorResponse } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  quizzlyLeagueSeat,
  quizzlyProfile,
  quizzlyQuizProgress,
} from "@/lib/db/schema";
import { ligueOuBronze } from "@/lib/quizzly/leagues";
import { portraitsPour } from "@/lib/quizzly/portraits";
import {
  jourParis,
  niveauDepuisXp,
  normaliserCosmetiques,
  recordSerie,
  semaineIso,
} from "@/lib/quizzly/rules";

export async function GET(
  _request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }

  const { userId } = await props.params;
  if (!userId) {
    return errorResponse("invalid_request", {
      message: "Identifiant manquant.",
    });
  }

  try {
    await dbReady();
    const db = getDb();
    const [profil] = await db
      .select()
      .from(quizzlyProfile)
      .where(eq(quizzlyProfile.userId, userId))
      .limit(1);

    if (!profil) {
      return errorResponse("not_found", { message: "Élève introuvable." });
    }

    const aujourdhui = jourParis(new Date());
    const semaine = semaineIso(aujourdhui);

    const [seat] = await db
      .select({ weeklyXp: quizzlyLeagueSeat.weeklyXp })
      .from(quizzlyLeagueSeat)
      .where(
        and(
          eq(quizzlyLeagueSeat.userId, userId),
          eq(quizzlyLeagueSeat.weekKey, semaine)
        )
      )
      .limit(1);

    const quizReussis = await db
      .select({ quizId: quizzlyQuizProgress.quizId })
      .from(quizzlyQuizProgress)
      .where(
        and(
          eq(quizzlyQuizProgress.userId, userId),
          eq(quizzlyQuizProgress.passed, true)
        )
      );

    const portraits = await portraitsPour([userId]);
    const portrait = portraits.get(userId);
    const cosmetiques = normaliserCosmetiques(profil.cosmetics);
    const niveau = niveauDepuisXp(profil.xp);

    return Response.json(
      {
        avatarUrl: portrait?.avatarUrl ?? null,
        displayName: portrait?.displayName ?? "Élève",
        equippedFrame: cosmetiques.equippedFrame,
        isMe: userId === session.userId,
        league: ligueOuBronze(profil.league),
        niveau: niveau.niveau,
        quizzesPassedCount: quizReussis.length,
        schoolYear: profil.schoolYear || "6e",
        streakBest: recordSerie(profil.streakCount, profil.streakBest),
        streakCount: profil.streakCount,
        userId,
        username: portrait?.username ?? "",
        weeklyXp: seat?.weeklyXp ?? 0,
        xp: profil.xp,
        xpDansPalier: niveau.xpDansPalier,
        xpPalier: niveau.xpPalier,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/quizzly/profil/[userId]", error);
    return errorResponse("database_error");
  }
}
