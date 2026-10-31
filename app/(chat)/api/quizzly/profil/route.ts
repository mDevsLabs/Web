import { z } from "zod";
import { fetchUserModels } from "@/lib/ai/models.server";
import { isModelAllowedForTier } from "@/lib/ai/registry/tiers";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { modeleCoachEnregistrable } from "@/lib/quizzly/coach";
import {
  enregistrerNomAffiche,
  lireNomAffiche,
} from "@/lib/quizzly/display-name";
import { origineConfiance } from "@/lib/quizzly/http";
import { SCHOOL_YEARS } from "@/lib/quizzly/program";
import {
  choisirAnnee,
  enregistrerModeleQuizzly,
  equiperCadre,
  resumeQuizzly,
} from "@/lib/quizzly/queries";

const corpsSchema = z
  .object({
    displayName: z.string().min(1).max(40).optional(),
    equippedFrame: z.string().min(1).max(40).nullable().optional(),
    modelId: z.string().max(120).nullable().optional(),
    schoolYear: z.enum(SCHOOL_YEARS).optional(),
  })
  .strict()
  .refine(
    (valeur) =>
      valeur.displayName !== undefined ||
      valeur.equippedFrame !== undefined ||
      valeur.modelId !== undefined ||
      valeur.schoolYear !== undefined,
    { message: "Aucune modification." }
  );

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return errorResponse("auth_required");
  }
  try {
    const resume = await resumeQuizzly(session.userId, session.user);
    return Response.json(resume, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("GET /api/quizzly/profil", error);
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
  const parsed = corpsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  try {
    let modelId: string | null | undefined;
    if (parsed.data.modelId !== undefined) {
      if (parsed.data.modelId === null) {
        modelId = null;
      } else {
        const catalogue = await fetchUserModels();
        const accepte = modeleCoachEnregistrable({
          autorise: (id) => isModelAllowedForTier(id, session.user.tier),
          catalogueIds: catalogue.map((modele) => modele.id),
          modelId: parsed.data.modelId,
        });
        if (!accepte) {
          return errorResponse("invalid_request", {
            message: "Ce modèle n'est pas disponible pour votre forfait.",
          });
        }
        modelId = parsed.data.modelId.trim();
      }
    }
    if (parsed.data.displayName !== undefined) {
      const ecrit = await enregistrerNomAffiche(
        session.userId,
        parsed.data.displayName
      );
      if (!ecrit.ok) {
        return errorResponse("invalid_request", { message: ecrit.message });
      }
    }
    if (parsed.data.schoolYear) {
      await choisirAnnee(session.userId, parsed.data.schoolYear);
    }
    if (modelId !== undefined) {
      await enregistrerModeleQuizzly(session.userId, modelId);
    }
    if (parsed.data.equippedFrame !== undefined) {
      const equipe = await equiperCadre(
        session.userId,
        parsed.data.equippedFrame
      );
      if (!equipe.ok) {
        return errorResponse("invalid_request", { message: equipe.message });
      }
    }
    const resume = await resumeQuizzly(session.userId, session.user);
    const nom = await lireNomAffiche(session.user);
    return Response.json(
      { ...resume, displayName: nom.displayName },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("PUT /api/quizzly/profil", error);
    return errorResponse("database_error");
  }
}
