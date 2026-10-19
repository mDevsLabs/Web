import { zipSync } from "fflate";
import { z } from "zod";
import {
  badRequest,
  isResponse,
  notFound,
  requireWakiesUser,
} from "@/lib/wakies/http";
import { findSpace, listPages } from "@/lib/wakies/queries";
import {
  construireArbre,
  type EnTeteEspace,
  ErreurExport,
  espaceEnJSON,
  espaceEnMarkdown,
  fichiersExport,
  type PageExport,
  slugDeTitre,
} from "@/lib/wakies/shared/space-export";

/**
 * GET /api/wakies/spaces/:spaceId/export?format=md|json|zip
 *
 * L'assemblage est serveur, et pour trois raisons :
 *  - le contenu enregistré des pages EST déjà du Markdown en base, il n'y a
 *    rien à convertir depuis l'éditeur — mais il faut le LIRE, et le rail ne
 *    charge les pages d'un Espace que quand sa flèche est ouverte ;
 *  - un client qui assemblerait devrait relire chaque page une par une (l'API
 *    de pages est par identifiant) : N+1 lectures pour un seul fichier ;
 *  - l'arbre, l'ordre et les noms de fichiers sont des règles qui doivent être
 *    déterministes et testables. Elles vivent donc dans un module pur
 *    (`lib/wakies/shared/space-export.ts`), pas dans un clic.
 *
 * L'export d'UNE SEULE page reste client (`PageDocument.tsx`) : c'est le
 * brouillon en cours de frappe, la seule valeur que le serveur n'a pas.
 */

const formats = z.enum(["json", "md", "zip"]);

/**
 * Un téléchargement : le nom du fichier est dans l'en-tête, le corps est déjà
 * encodé. `no-store` parce qu'un Espace se modifie entre deux exports.
 */
function reponseFichier(corps: BodyInit, nom: string, type: string): Response {
  return new Response(corps, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${nom}"`,
      "Content-Type": type,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const identite = await requireWakiesUser();
  if (isResponse(identite)) {
    return identite;
  }
  const { spaceId } = await params;
  const interroge = new URL(request.url);
  const analysé = formats.safeParse(
    interroge.searchParams.get("format") ?? "md"
  );
  if (!analysé.success) {
    return badRequest("Format d'export inconnu : md, json ou zip.");
  }
  const format = analysé.data;

  const espace = await findSpace(identite.userId, spaceId);
  if (!espace) {
    return notFound("Espace introuvable.");
  }
  const lignes = await listPages(identite.userId, spaceId);
  // Les horodatages de PostgreSQL sont des `Date` ; le module pur raisonne en
  // millisecondes, comme tout le contrat client de Wakies (`versClient`).
  const pages: PageExport[] = lignes.map((ligne) => ({
    content: ligne.content,
    createdAt: ligne.createdAt.getTime(),
    id: ligne.id,
    parentId: ligne.parentId,
    revision: ligne.revision,
    title: ligne.title,
    updatedAt: ligne.updatedAt.getTime(),
  }));
  const entete: EnTeteEspace = {
    createdAt: espace.createdAt.getTime(),
    description: espace.description,
    name: espace.name,
  };

  const nom = slugDeTitre(espace.name) || "espace";
  const racines = construireArbre(pages);

  try {
    if (format === "md") {
      return reponseFichier(
        espaceEnMarkdown(entete, racines),
        `espace-${nom}.md`,
        "text/markdown; charset=utf-8"
      );
    }
    if (format === "json") {
      return reponseFichier(
        espaceEnJSON(entete, racines),
        `espace-${nom}.json`,
        "application/json; charset=utf-8"
      );
    }
    const encodes: Record<string, Uint8Array> = {};
    for (const [chemin, contenu] of Object.entries(
      fichiersExport(entete, racines)
    )) {
      encodes[chemin] = new TextEncoder().encode(contenu);
    }
    return reponseFichier(
      new Blob([zipSync(encodes)], { type: "application/zip" }),
      `espace-${nom}.zip`,
      "application/zip"
    );
  } catch (erreur) {
    // Une borne dépassée est un refus EXPRIMÉ, jamais une archive tronquée :
    // personne n'ouvre un ZIP pour vérifier qu'il y a bien toutes les pages.
    if (erreur instanceof ErreurExport) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: erreur.message }),
        {
          headers: { "Content-Type": "application/json; charset=utf-8" },
          status: 413,
        }
      );
    }
    throw erreur;
  }
}
