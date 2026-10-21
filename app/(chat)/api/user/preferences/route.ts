import { NextResponse } from "next/server";
import { z } from "zod";
import { REASONING_LEVELS } from "@/lib/ai/registry/reasoning";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { APP_KEYS } from "@/lib/apps/catalog";
import { requireUser } from "@/lib/auth/require-user";
import { CREATION_MODES } from "@/lib/creation/mode";
import { getUserPreferences, upsertUserPreferences } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import {
  DICTATION_LANGUAGES,
  normalizeDictationLanguage,
  normalizeTranslationTarget,
  TRANSLATION_TARGET_CODE_LIST,
} from "@/lib/i18n/languages";
import {
  buildCustomInstructionsSchema,
  customInstructionsLimitPayload,
} from "@/lib/plans/custom-instructions";
import { getTierSearchResultsMax } from "@/lib/plans/tier-limits";
import {
  MAI_SEARCH_LANGUAGES,
  MAI_SEARCH_RESULT_COUNT_MIN,
  MAI_SEARCH_SAFETY_LEVELS,
  MAI_SEARCH_SOURCE_KEYS,
} from "@/lib/search/sources";
import {
  normalizeThemePreference,
  THEME_PREFERENCES,
} from "@/lib/theme/preference";

// La limite de customInstructions dépend du forfait : le schéma est donc
// construit par requête. Avant, `z.string().max(4000)` était figé ici comme
// dans 6 autres routes — un compte Pro ou Max ne pouvait pas dépasser 4000
// caractères, alors que le produit l'annonçait sans limite.
const buildSchema = (tier?: string | null) =>
  z.object({
    customInstructions: buildCustomInstructionsSchema(tier),
    defaultAgentId: z.string().uuid().nullable().optional(),
    // Menu favori : les quatre clés viennent du même catalogue que l'interface
    // (lib/apps/catalog.ts) — impossible qu'une clé valide soit refusée, ni
    // qu'une application fantôme soit persistée.
    defaultApp: z.enum(APP_KEYS).optional(),
    defaultAudioModel: z.string().max(150).optional(),
    defaultAudioSpeed: z.number().min(0.5).max(2.0).optional(),
    defaultAudioVoice: z.string().max(100).optional(),
    defaultChatModel: z.string().max(200).nullable().optional(),
    defaultChatVisibility: z.enum(["private", "public"]).optional(),
    defaultCreationMode: z.enum(CREATION_MODES).optional(),
    // Les deux listes viennent de lib/i18n/languages.ts, la même source que le
    // sélecteur de l'interface : impossible qu'un code valide soit refusé par
    // l'API, ni qu'une cible DeepL fantôme soit acceptée puis rejetée en aval.
    defaultDictationLanguage: z
      .string()
      .transform(normalizeDictationLanguage)
      .pipe(z.enum(DICTATION_LANGUAGES.map((entry) => entry.value)))
      .optional(),
    defaultImageModel: z.string().max(150).optional(),
    defaultImageSize: z.string().max(50).optional(),
    defaultTranslationLanguage: z
      .string()
      .transform((value) => normalizeTranslationTarget(value) ?? "EN")
      .pipe(z.enum(TRANSLATION_TARGET_CODE_LIST as [string, ...string[]]))
      .optional(),
    enabled: z.boolean().optional(),
    ghostMemoryEnabled: z.boolean().optional(),
    reasoningLevel: z.enum(REASONING_LEVELS).optional(),
    // Préférences de recherche mAI Search. Les listes viennent de
    // `lib/search/sources.ts` — la même source que l'interface : impossible
    // qu'une source valide soit refusée par l'API, ni qu'une source
    // fantôme soit acceptée puis rejetée en aval.
    searchLanguage: z.enum(MAI_SEARCH_LANGUAGES).optional(),
    // Le volume de résultats est plafonné par le FORFAIT du compte, pas par
    // une constante : la borne haute du schéma est donc calculée à chaque
    // requête. Un compte gratuit ne peut pas enregistrer 200, et l'interface
    // ne peut donc pas lui proposer plus que ce qu'il peut obtenir.
    searchResultCount: z
      .number()
      .int()
      .min(MAI_SEARCH_RESULT_COUNT_MIN)
      .max(getTierSearchResultsMax(tier))
      .optional(),
    searchSafetyLevel: z.enum(MAI_SEARCH_SAFETY_LEVELS).optional(),
    // Une liste vide serait acceptée ici mais normalisée en « toutes les
    // sources » : on la refuse donc, pour que l'interface comprenne
    // l'erreur au lieu de croire avoir enregistré un choix.
    searchSources: z.array(z.enum(MAI_SEARCH_SOURCE_KEYS)).min(1).optional(),
    showAgentChatIcons: z.boolean().optional(),
    temperature: z.number().min(0).max(2).optional(),
    // Thème partagé par la suite (mAI, Site, Vibe, Wakies). Une valeur
    // illisible retombe sur « system » : enregistrer les autres réglages ne
    // doit pas échouer à cause du thème.
    theme: z.string().transform(normalizeThemePreference).optional(),
    topP: z.number().min(0).max(1).optional(),
  });

export async function GET() {
  // `requireUser` dérive l'identité canonique (`id || email`). Cette route lisait
  // `user.id` et refusait la session dès qu'il était vide : pour un compte dont
  // l'identifiant persistant EST l'adresse, les préférences étaient inaccessibles
  // et l'interface revenait à ses valeurs par défaut.
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  try {
    const prefs = await getUserPreferences(session.userId);
    return NextResponse.json(prefs);
  } catch (e) {
    console.error("GET user preferences error", e);
    return NextResponse.json({
      customInstructions: "",
      defaultAgentId: null,
      defaultApp: "mai",
      defaultAudioModel: "deepgram/flux-tts:free",
      defaultAudioSpeed: 1.0,
      defaultAudioVoice: "flux-alexis-en",
      defaultChatModel: null,
      defaultChatVisibility: "private",
      defaultCreationMode: "image",
      defaultDictationLanguage: "auto",
      defaultImageModel: "black-forest-labs/flux-schnell",
      defaultImageSize: "1024x1024",
      defaultTranslationLanguage: "EN",
      enabled: false,
      ghostMemoryEnabled: false,
      reasoningLevel: "medium",
      // Préférences de recherche mAI Search : les défauts du serveur, pour
      // que l'interface affiche une section cohérente même quand la table
      // des préférences est illisible.
      searchLanguage: "fr",
      searchResultCount: 10,
      searchSafetyLevel: "medium",
      searchSources: [...MAI_SEARCH_SOURCE_KEYS],
      showAgentChatIcons: true,
      temperature: 0.7,
      // Valeur par défaut sûre : aucune préférence partagée connue.
      theme: "system",
      topP: 0.9,
    });
  }
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }
  const { user, userId } = session;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = buildSchema(user.tier).safeParse(body);
    if (!parsed.success) {
      // Un dépassement de longueur mérite un message de forfait, pas une
      // liste de champs invalides : on le distingue avant le repli Zod.
      const raw = (body as { customInstructions?: unknown }).customInstructions;
      if (typeof raw === "string") {
        const payload = customInstructionsLimitPayload(user.tier, raw.length);
        if (payload) {
          return errorResponse("invalid_request", payload);
        }
      }
      return errorResponse("invalid_request", {
        message: zodIssuesMessage(parsed.error),
      });
    }

    const updated = await upsertUserPreferences(userId, parsed.data);
    return NextResponse.json({ preferences: updated, success: true });
  } catch (e) {
    console.error("POST user preferences error", e);
    return new ChatbotError("bad_request:database").toResponse();
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}
