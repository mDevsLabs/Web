import { type NextRequest, NextResponse } from "next/server";
import { upstreamUrl } from "@/lib/api/upstream";

/**
 * POST /api/site/v1beta/models/[...model] — passe-plat Google Generative AI.
 *
 * Deux choix structurels, tous deux imposés par des faits du dépôt :
 *
 * 1. Le segment est un catch-all. L'allowlist de l'exécuteur publie des
 *    identifiants à plusieurs segments (`lib/site/api-key-routes.ts:299`,
 *    `v1beta/models/poolside/laguna-xs-2.1:free:generateContent`) : un `[model]`
 *    simple ne peut pas les servir et répond 404 avant tout traitement.
 * 2. L'authentification est relayée, pas répliquée. Le handler exige un `Bearer`
 *    (une requête anonyme ne doit jamais atteindre l'amont), puis transmet le
 *    jeton : la validation de la clé, le quota et la facturation vivent dans le
 *    backend qui les applique déjà. Valider ici introduirait une deuxième source
 *    de vérité et une dépendance à la base PostgreSQL pour une API qui n'en a pas
 *    besoin.
 *
 * La requête arrive sans cookie de session : `proxy.ts` exempte ce préfixe (voir
 * `lib/security/proxy-policy.ts`). L'exemption ne retire que l'exigence du cookie.
 */

/*
 * Un jeton de génération peut légitimement dépasser une minute : aucun délai
 * artificiel n'est posé ici, contrairement aux routes JSON, et un `AbortSignal`
 * tuerait le flux en cours de route.
 *
 * Validation SEGMENT par segment, et non sur la chaîne recollée : un motif global
 * tolérant les points accepte `../../etc/passwd`, que l'amont résoudrait hors de
 * `/v1beta/models/`. Le premier caractère doit donc alphanumérique — ce qui écarte
 * `.` et `..` par construction plutôt que par une liste noire.
 */
const SEGMENT_MODELE = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function erreurAuth(): NextResponse {
  return NextResponse.json(
    {
      error: {
        message: "Auth requise : Bearer token manquant.",
        type: "authentication_error",
      },
    },
    { status: 401 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ model: string[] }> }
) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return erreurAuth();
  }

  const { model: segments } = await params;
  const modele = segments.join("/");

  // Un catch-all accepte aussi le segment parent vide (`/models`) et découpe un
  // id à slash en plusieurs paramètres : les deux doivent être refusés avant
  // toute sortie réseau.
  if (
    segments.length === 0 ||
    segments.some((segment) => !SEGMENT_MODELE.test(segment))
  ) {
    return NextResponse.json(
      {
        error: {
          code: "model_not_found",
          message: "Identifiant de modèle invalide.",
          param: "model",
          type: "invalid_request_error",
        },
      },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    // `alt=sse` et les autres paramètres de l'SDK Google doivent parvenir à
    // l'amont : les jeter rend `streamGenerateContent` muet plutôt que rapide.
    const query: Record<string, string> = {};
    for (const [cle, valeur] of req.nextUrl.searchParams.entries()) {
      query[cle] = valeur;
    }

    const res = await fetch(upstreamUrl(`/v1beta/models/${modele}`, query), {
      body: JSON.stringify(body),
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const contentType = res.headers.get("content-type") ?? "application/json";
    // Un flux `text/event-stream` recopié dans `NextResponse.json` cesse d'être
    // un flux : le client attendrait des jetons et reçoit un blob.
    if (contentType.includes("text/event-stream") && res.body) {
      return new Response(res.body, {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": contentType,
        },
        status: res.status,
      });
    }

    const data = await res.json().catch(() => null);
    if (data === null) {
      return NextResponse.json(
        {
          error: {
            message: "Le service n'a pas renvoyé de réponse exploitable.",
            type: "api_error",
          },
        },
        { status: res.ok ? 502 : res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (erreur: unknown) {
    // Le détail part en log, jamais au client : un message d'exception peut
    // porter une URL interne ou un fragment de jeton.
    console.error("[api/site/v1beta]", erreur);
    return NextResponse.json(
      {
        error: {
          message:
            "La requête vers le modèle n'a pas pu être traitée. Réessayez dans un instant.",
          type: "api_error",
        },
      },
      { status: 500 }
    );
  }
}
