import { type NextRequest, NextResponse } from "next/server";
import { errorResponse, logError } from "@/lib/api/error-response";
import { requireUser } from "@/lib/auth/require-user";
import { packCredential } from "@/lib/integrations/credential-envelope";
import { resolveAccount } from "@/lib/integrations/oauth";
import { getIntegrationProvider } from "@/lib/integrations/providers";
import { storeConnection } from "@/lib/integrations/repository";
import {
  hasControlCharacter,
  validateTokenFields,
} from "@/lib/integrations/token-fields";
import { isEncryptionConfigured } from "@/lib/mcp/encryption";

/**
 * Connexion par jeton personnel.
 *
 * Discord et Notion passent par un consentement OAuth ; Vercel, non : son OAuth
 * public ne donne aujourd'hui que l'identité, les permissions d'accès aux
 * projets étant réservées à une bêta privée. L'utilisateur colle donc un jeton
 * créé chez Vercel.
 *
 * Trois règles, dans cet ordre :
 *
 *  1. le jeton est VALIDÉ chez le fournisseur avant d'être stocké — enregistrer
 *     un jeton mort produirait une fiche « Connecté » et des outils muets ;
 *  2. il est CHIFFRÉ par le dépôt, jamais stocké en clair ;
 *  3. il n'est jamais renvoyé au client, ni journalisé, même tronqué.
 *
 * Un connecteur OAuth n'a pas le droit d'emprunter cette route : sans cela, un
 * jeton collé à la main remplacerait un consentement révoqué et la fiche
 * afficherait des portées que personne n'a accordées.
 */

const MAX_BODY_BYTES = 8000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const auth = await requireUser();
  if (!auth) {
    return errorResponse("auth_required", {
      message: "Connectez-vous pour enregistrer un jeton.",
    });
  }

  const { provider } = await params;
  const descriptor = getIntegrationProvider(provider);
  if (!descriptor) {
    return errorResponse("not_found", {
      message: `Connecteur inconnu : « ${provider} ».`,
    });
  }
  if (descriptor.authMode !== "token") {
    return errorResponse("invalid_request", {
      message: `${descriptor.label} se connecte par consentement OAuth, pas par jeton.`,
    });
  }

  if (!isEncryptionConfigured()) {
    // Stocker un jeton sans clé le laisserait en clair : on refuse AVANT de
    // lire le secret, plutôt que d'écrire quelque chose d'inutilisable.
    return errorResponse("service_unavailable", {
      message:
        "Le coffre de secrets n'est pas configuré sur cette instance : MCP_ENCRYPTION_KEY doit être posée sur le serveur.",
    });
  }

  let body: { fields?: unknown; token?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return errorResponse("invalid_request", {
        message: "Jeton trop long.",
      });
    }
    body = JSON.parse(raw || "{}") as { fields?: unknown; token?: unknown };
  } catch {
    return errorResponse("invalid_request", {
      message: "Corps de requête illisible.",
    });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return errorResponse("invalid_request", {
      message: "Jeton manquant.",
    });
  }
  if (
    token.length < (descriptor.token?.minLength ?? 8) ||
    token.length > (descriptor.token?.maxLength ?? 500)
  ) {
    return errorResponse("invalid_request", {
      message: `Le jeton doit contenir entre ${descriptor.token?.minLength ?? 8} et ${descriptor.token?.maxLength ?? 500} caractères.`,
    });
  }

  if (hasControlCharacter(token) || token.startsWith("mai-cred.v1.")) {
    return errorResponse("invalid_request", {
      message: "Jeton refusé.",
    });
  }
  const fields = validateTokenFields(
    descriptor.token?.fields ?? [],
    body.fields
  );
  if (!fields.ok) {
    return errorResponse("invalid_request", { message: fields.error });
  }
  const stored =
    descriptor.token?.fields && descriptor.token.fields.length > 0
      ? packCredential(token, fields.fields)
      : token;

  try {
    const identity = await resolveAccount(
      descriptor,
      {
        accessToken: stored,
        expiresAt: null,
        idToken: null,
        refreshToken: null,
        scopes: descriptor.scopes.join(" "),
      },
      { clientId: "", clientSecret: "" }
    );
    if (!identity) {
      // Le fournisseur a répondu, mais sans identité exploitable : le jeton est
      // invalide ou n'a pas les droits minimaux. Ne rien stocker.
      return errorResponse("invalid_request", {
        message: descriptor.token?.fields?.length
          ? `Jeton refusé par ${descriptor.label}. Vérifiez les champs et que le jeton est actif.`
          : `Jeton refusé par ${descriptor.label}. Vérifiez qu'il est valide et actif.`,
      });
    }

    await storeConnection({
      accessToken: stored,
      accountEmail: identity.accountEmail,
      accountLabel: identity.accountLabel,
      expiresAt: null,
      provider: descriptor.id,
      providerAccountId: identity.providerAccountId,
      refreshToken: null,
      scopes: descriptor.scopes.join(" "),
      userId: auth.userId,
    });

    console.info(
      `[integration] guard=token provider=${descriptor.id} account=${identity.providerAccountId}`
    );

    return NextResponse.json({
      accountLabel: identity.accountLabel,
      success: true,
    });
  } catch (error) {
    logError(`POST /api/integration/${provider}/token`, error);
    return errorResponse("internal_error", {
      message: "Impossible d'enregistrer le jeton.",
    });
  }
}
