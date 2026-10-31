import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import {
  getBlacklineSettings,
  saveBlacklineSettings,
} from "@/lib/blackline/queries";
import {
  BLACKLINE_SETTINGS_MAX_BYTES,
  isValidBlacklineSettingsBody,
} from "@/lib/blackline/settings";
import { lireNomAffiche } from "@/lib/quizzly/display-name";
import { superposerIndicatif } from "@/lib/quizzly/name";

/**
 * GET    /api/blackline/settings — les réglages enregistrés du compte.
 * PUT    /api/blackline/settings — remplace les réglages du compte.
 *
 * LE JEU EST OUVERT À TOUS LES FORFAITS
 *
 * Blackline ne consomme aucun token IA et ne fait appel à aucun service
 * payant : il n'y a donc pas de paywall, contrairement à Wakies ou au mode
 * Agent. Un compte Free accède à ses réglages comme aux autres.
 *
 * LA MUTATION EST PROTÉGÉE PAR L'ORIGINE
 *
 * L'écriture utilise le cookie de session : une requête cross-site pourrait
 * y écrire des réglages sans que l'utilisateur l'ait demandé. La règle est
 * la même que celle de Wakies (`sec-fetch-site` puis comparaison d'origine).
 *
 * LE SERVEUR FAIT FOI
 *
 * L'objet reçu est normalisé avant écriture (voir lib/blackline/settings.ts) :
 * les clés illisibles sont ignorées, les nombres bornés, les énumérations
 * ramenées à une valeur connue. Un réglage illisible ne fait donc JAMAIS
 * échouer l'enregistrement des autres.
 */

const schema = z
  .object({
    settings: z.record(z.string(), z.unknown()),
  })
  .strict();

/** L'origine de la requête est-elle celle de l'hôte ? */
function origineConfiance(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") {
    return false;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const settings = await getBlacklineSettings(session.userId);
    const nom = await lireNomAffiche(session.user);
    return Response.json(
      {
        displayName: nom.displayName,
        settings: superposerIndicatif(settings, nom.displayName),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET /api/blackline/settings", error);
    return errorResponse("database_error");
  }
}

export async function PUT(request: Request) {
  if (!origineConfiance(request)) {
    return errorResponse("access_denied", {
      message: "Origine de la requête non autorisée.",
    });
  }

  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }

  // La taille est bornée AVANT l'écriture : une clé de plusieurs mégaoctets
  // ne doit jamais atteindre la base.
  if (!isValidBlacklineSettingsBody(parsed.data.settings)) {
    return errorResponse("payload_too_large", {
      message: `Les réglages Blackline dépassent la taille maximale (${BLACKLINE_SETTINGS_MAX_BYTES} octets).`,
    });
  }

  try {
    const nom = await lireNomAffiche(session.user);
    const settings = await saveBlacklineSettings(
      session.userId,
      superposerIndicatif(parsed.data.settings, nom.displayName)
    );
    return Response.json(
      {
        displayName: nom.displayName,
        settings: superposerIndicatif(settings, nom.displayName),
        success: true,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("PUT /api/blackline/settings", error);
    return errorResponse("database_error");
  }
}
