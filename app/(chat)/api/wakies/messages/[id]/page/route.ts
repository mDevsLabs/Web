import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import {
  badRequest,
  isResponse,
  json,
  notFound,
  rejectCrossOriginMutation,
  requireWakiesUser,
  toErrorResponse,
} from "@/lib/wakies/http";
import {
  createPage,
  definirEpingle,
  messageDuCompte,
  spaceExists,
} from "@/lib/wakies/queries";

/**
 * POST /api/wakies/messages/:id/page {spaceId} — « Enregistrer en page ».
 *
 * Sauvegarder, dans Wakies, c'est DEUX choses et une seule action :
 *
 *   1. ÉPINGLER le message — il rejoint la bande des épingles du fil, donc il
 *      reste sous les yeux dans son contexte d'origine ;
 *   2. en faire une PAGE de l'espace choisi — une citation en bloc Markdown,
 *      datée et attribuée, donc gardée même si la conversation est supprimée.
 *
 * L'auteur est nommé sans ambiguïté dans la page : « vous » ou le nom du
 * Wakie qui a écrit. Cette attribution vient du message stocké, jamais d'un
 * champ fourni par le client.
 */

const schema = z.object({ spaceId: z.string().min(1) }).strict();

/** Bloc de citation Markdown : contenu, puis attribution datée. */
function pageMarkdown(message: {
  conversationTitre: string;
  createdAt: Date;
  extrait: string;
  role: string;
}): string {
  const date = message.createdAt.toISOString().slice(0, 10);
  const auteur = message.role === "user" ? "vous" : "un Wakie";
  const corps = message.extrait
    .split("\n")
    .map((ligne) => `> ${ligne}`)
    .join("\n");
  return `${corps}\n\n— ${auteur}, le ${date}, depuis « ${message.conversationTitre} »`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origine = rejectCrossOriginMutation(request);
  if (origine) return origine;
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const { id } = await params;
  if (!(await spaceExists(identite.userId, parsed.data.spaceId))) {
    return notFound("Espace introuvable.");
  }
  const message = await messageDuCompte(identite.userId, id);
  if (!message) {
    return notFound("Message introuvable sur ce compte.");
  }
  if (!message.extrait) {
    return badRequest(
      "Ce message ne contient pas de texte à enregistrer (appel d'outil ou pièce jointe seule)."
    );
  }
  try {
    const page = await createPage(
      identite.userId,
      parsed.data.spaceId,
      {
        content: pageMarkdown(message),
        title: `Message — ${message.extrait.slice(0, 60)}`,
      },
      message.conversationId
    );
    await definirEpingle(identite.userId, id, true);
    return json({ page }, { status: 201 });
  } catch (erreur) {
    return erreur instanceof Error
      ? badRequest(erreur.message)
      : toErrorResponse(erreur);
  }
}
