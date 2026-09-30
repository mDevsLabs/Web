import { generateText } from "ai";
import { z } from "zod";
import { getUtilityModel } from "@/lib/ai/providers";
import {
  errorResponse,
  logError,
  normalizeUpstreamError,
  zodIssuesMessage,
} from "@/lib/api/error-response";
import { getMaiSessionToken, getMaiUser } from "@/lib/auth/session";
import { MAI_API_URL } from "@/lib/constants";
import { recordTokenUsage } from "@/lib/db/queries";
import {
  DEFAULT_TRANSLATION_TARGET,
  normalizeTranslationTarget,
  TRANSLATION_TARGET_CODE_LIST,
  translationTargetLabel,
} from "@/lib/i18n/languages";

// Traduction d'une réponse de l'IA.
//
// Deux moteurs, un seul point d'entrée. DeepL (via le backend Val Town
// `mai-translate.ts`) est le moteur nominal : rapide, déterministe, et mis en
// cache par empreinte du texte. Le repli mAI n'existe que pour que l'icône ne
// devienne pas un bouton mort quand une clé DeepL tombe — il est facturé
// comme n'importe quel appel de modèle, quota compris.
//
// Pourquoi le repli est ici et pas dans le backend : `MAIAgentFleet` résout la
// clé et le modèle par `Number(userId)` sur la table `users` du réseau social
// Vibe. Pour un utilisateur mAI Web (UUID) il renvoie `null` : le repli
// serait mort-né. Ici on possède le modèle, le forfait et la comptabilité.

const translateSchema = z.object({
  targetLang: z.string().min(2).max(10).optional(),
  text: z.string().min(1).max(20_000),
});

/**
 * Consigne du repli mAI.
 *
 * Volontairement sans JSON : une réponse JSON fait échouer la traduction sur
 * une seule accolade mal échappée, alors qu'un texte brut n'échoue jamais. Le
 * modèle ne doit rien invoker, rien chercher : uniquement rendre un texte.
 */
function fallbackSystemPrompt(targetLang: string): string {
  return [
    "Tu es un moteur de traduction. Tu traduis le texte fourni, et rien d'autre.",
    "",
    "RÈGLES",
    `- Traduis intégralement en ${translationTargetLabel(targetLang)}.`,
    "- Le texte est la sortie d'une IA de conversation : conserve sa structure,",
    "  ses listes, ses titres et sa mise en forme d'origine.",
    "- Conserve tels quels les hashtags, mentions @, liens, chemins de fichiers,",
    "  identifiants, noms propres de produits et fragments de code.",
    "- Ne commente pas la traduction, ne l'introduis pas, ne l'entoure pas de",
    "  guillemets. Renvoie uniquement le texte traduit.",
  ].join("\n");
}

type TranslateResult = {
  cached: boolean;
  detectedLanguage: string;
  provider: string;
  sameLanguage: boolean;
  targetLang: string;
  translation: string;
};

export async function POST(request: Request) {
  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required", {
      message: "Non authentifié. Veuillez vous connecter.",
    });
  }
  const sessionToken = await getMaiSessionToken();
  if (!sessionToken) {
    return errorResponse("auth_required", {
      message: "Session expirée. Veuillez vous reconnecter.",
    });
  }

  let targetLang: string;
  let text: string;
  try {
    const parsed = translateSchema.parse(await request.json());
    targetLang =
      normalizeTranslationTarget(parsed.targetLang) ??
      DEFAULT_TRANSLATION_TARGET;
    text = parsed.text;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(error),
      });
    }
    return errorResponse("invalid_request", {
      message: "Requête de traduction illisible.",
    });
  }

  try {
    // ── Moteur nominal : DeepL via Val Town ────────────────────────────────
    const upstream = await fetch(`${MAI_API_URL}/v1/mai/translate`, {
      body: JSON.stringify({ target_lang: targetLang, text }),
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (upstream.ok) {
      const data = (await upstream.json()) as {
        cached?: boolean;
        detected_language?: string;
        provider?: string;
        same_language?: boolean;
        target_lang?: string;
        translation?: string;
      };
      if (data?.translation) {
        const result: TranslateResult = {
          cached: Boolean(data.cached),
          detectedLanguage: data.detected_language ?? "",
          provider: data.provider ?? "deepl",
          sameLanguage: Boolean(data.same_language),
          targetLang: data.target_lang ?? targetLang,
          translation: data.translation,
        };
        return Response.json(result, { status: 200 });
      }
      // 200 sans texte : on ne fait pas confiance à la réponse, on tente le repli.
    } else if (upstream.status !== 503) {
      // 503 = DeepL indisponible, et ONLY CASE où le repli a du sens.
      // 400 (entrée refusée), 401 (session expirée), 429 (débit atteint) sont
      // remontés tels quels : les traduire en « réessayez » masquerait la cause.
      const data = await upstream.json().catch(() => ({}));
      const payload = normalizeUpstreamError(data, upstream.status);
      return Response.json(payload, { status: payload.status });
    }

    // ── Repli mAI ─────────────────────────────────────────────────────────
    // Le quota est vérifié et débité par le backend via /v1/chat/completions :
    // cette route ne duplique pas la règle, elle ne fait que la laisser
    // s'appliquer au passage.
    const model = await getUtilityModel({
      sessionToken,
      userId: user.id,
    });

    const { text: translated, usage } = await generateText({
      model,
      prompt: text,
      system: fallbackSystemPrompt(targetLang),
    });

    const translation = String(translated ?? "").trim();
    if (!translation) {
      return errorResponse("upstream_error", {
        message: "Traduction vide. Réessayez dans un instant.",
      });
    }

    const totalTokens = usage?.totalTokens ?? 0;
    if (totalTokens > 0) {
      // Même comptabilité qu'une conversation : le repli consomme du quota.
      await recordTokenUsage({
        inputTokens: usage.inputTokens ?? 0,
        model: "translation-fallback",
        outputTokens: usage.outputTokens ?? 0,
        totalTokens,
        userEmail: user.email,
        userId: user.id ?? user.email,
      }).catch((error: unknown) => {
        // Un échec de comptage ne doit pas faire perdre la traduction : le
        // quota sera rattrapé par la consommation du message d'origine.
        logError("Échec d'enregistrement de l'usage (traduction)", error);
      });
    }

    const result: TranslateResult = {
      // Aucun cache de repli : DeepL garde le sien par empreinte, et dupliquer
      // le stockage pour une panne intermittente n'en vaut pas la peine.
      cached: false,
      detectedLanguage: "",
      provider: "mai",
      // Sans détection fiable, on ne prétend pas que c'est déjà traduit : le
      // texte peut être dans n'importe quelle langue.
      sameLanguage: false,
      targetLang,
      translation,
    };
    return Response.json(result, { status: 200 });
  } catch (error) {
    logError("Erreur de traduction", error);
    return errorResponse("upstream_error", {
      message:
        "Traduction indisponible pour le moment. Réessayez dans quelques instants.",
    });
  }
}

/** Liste des cibles acceptées, pour que l'interface ne se désynchronise jamais
 *  du validateur serveur. */
export async function GET() {
  return Response.json({
    defaultTarget: DEFAULT_TRANSLATION_TARGET,
    targets: TRANSLATION_TARGET_CODE_LIST,
  });
}
