import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { ReasoningLevel } from "@/lib/ai/registry/reasoning";
import { normalizeAppKey } from "@/lib/apps/catalog";
import { normalizeCreationMode } from "@/lib/creation/mode";
import { ChatbotError } from "@/lib/errors";
import {
  AUTO_DICTATION_LANGUAGE,
  DEFAULT_TRANSLATION_TARGET,
  normalizeDictationLanguage,
  normalizeTranslationTarget,
} from "@/lib/i18n/languages";
import type { ScheduleToolMode } from "@/lib/planning/tool-mode";
import { normalizeScheduleToolMode } from "@/lib/planning/tool-mode";
import {
  type MaiSearchLanguage,
  type MaiSearchSafetyLevel,
  type MaiSearchSourceKey,
  normalizeMaiSearchLanguage,
  normalizeMaiSearchResultCount,
  normalizeMaiSearchSafetyLevel,
  normalizeMaiSearchSources,
} from "@/lib/search/sources";
import { normalizeThemePreference } from "@/lib/theme/preference";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  type DocumentProposal,
  document,
  documentProposal,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  message,
  pluginInstallation,
  project,
  projectFile,
  projectInvite,
  projectMember,
  type ScheduledMessage,
  type Skill,
  type Suggestion,
  scheduledMessage,
  skill,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  toolExecution,
  userMcpPrefs,
  userMemory,
  vote,
} from "../schema";
import { _rawClient, dbReady, getDb, getRawClient } from "./connection";

// ==========================================
// USER AI PREFERENCES QUERIES
// ==========================================

export async function getUserPreferences(userId: string) {
  const { userPreferences } = await import("../schema");
  try {
    const db = await dbReady();
    const [row] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (row) {
      return {
        customInstructions: row.customInstructions || "",
        defaultAgentId: row.defaultAgentId || null,
        defaultApp: normalizeAppKey(row.defaultApp),
        defaultAudioModel: row.defaultAudioModel || "deepgram/flux-tts:free",
        defaultAudioSpeed: row.defaultAudioSpeed ?? 1.0,
        defaultAudioVoice: row.defaultAudioVoice || "flux-alexis-en",
        defaultChatModel: row.defaultChatModel || null,
        defaultChatVisibility:
          (row.defaultChatVisibility as "private" | "public") || "private",
        defaultCreationMode: normalizeCreationMode(row.defaultCreationMode),
        // Une locale ou une cible illisible retombe sur son défaut : la
        // dictée et la traduction doivent toujours fonctionner.
        defaultDictationLanguage: normalizeDictationLanguage(
          row.defaultDictationLanguage
        ),
        defaultImageModel:
          row.defaultImageModel || "black-forest-labs/flux-schnell",
        defaultImageSize: row.defaultImageSize || "1024x1024",
        defaultTranslationLanguage:
          normalizeTranslationTarget(row.defaultTranslationLanguage) ??
          DEFAULT_TRANSLATION_TARGET,
        enabled: Boolean(row.customInstructionsEnabled),
        ghostMemoryEnabled: Boolean(row.ghostMemoryEnabled),
        pagesDefaultModel: row.pagesDefaultModel?.trim() || null,
        pagesDefaultPrompt: row.pagesDefaultPrompt ?? "",
        reasoningLevel: (row.reasoningLevel as ReasoningLevel) || "medium",
        // Préférences de recherche mAI Search : normalisées à la lecture, une
        // valeur illisible ne doit jamais faire échouer l'affichage des
        // paramètres (ni le moteur de recherche).
        searchLanguage: normalizeMaiSearchLanguage(row.searchLanguage),
        searchResultCount: normalizeMaiSearchResultCount(row.searchResultCount),
        searchSafetyLevel: normalizeMaiSearchSafetyLevel(row.searchSafetyLevel),
        searchSources: normalizeMaiSearchSources(row.searchSources),
        showAgentChatIcons: row.showAgentChatIcons ?? true,
        temperature: row.defaultTemperature ?? 0.7,
        // Thème partagé par la suite : une valeur illisible retombe sur
        // « system », jamais sur un thème fantôme.
        theme: normalizeThemePreference(row.theme),
        topP: row.defaultTopP ?? 0.9,
      };
    }
  } catch (e) {
    console.error("getUserPreferences query error:", e);
  }

  const legacy = await getUserModelPreferences(userId);
  return {
    customInstructions: legacy.customInstructions ?? "",
    defaultAgentId: null,
    defaultApp: "mai",
    defaultAudioModel: "deepgram/flux-tts:free",
    defaultAudioSpeed: 1.0,
    defaultAudioVoice: "flux-alexis-en",
    defaultChatModel: null,
    defaultChatVisibility: "private" as const,
    defaultCreationMode: "image" as const,
    defaultDictationLanguage: AUTO_DICTATION_LANGUAGE,
    defaultImageModel: "black-forest-labs/flux-schnell",
    defaultImageSize: "1024x1024",
    defaultTranslationLanguage: DEFAULT_TRANSLATION_TARGET,
    enabled: legacy.customInstructionsEnabled,
    ghostMemoryEnabled: false,
    pagesDefaultModel: null,
    pagesDefaultPrompt: "",
    reasoningLevel: "medium" as const,
    // Table `user_preferences` absente (environnement non migré) : les
    // préférences de recherche retombent sur leurs défauts. La recherche
    // continue de fonctionner, avec toutes les sources.
    searchLanguage: "fr" as const,
    searchResultCount: 10,
    searchSafetyLevel: "medium" as const,
    searchSources: normalizeMaiSearchSources(undefined),
    showAgentChatIcons: true,
    temperature: legacy.defaultTemperature ?? 0.7,
    // Table user_preferences absente (environnement non migré) : le thème
    // partagé n'a pas de colonne de repli dans `users`. On répond la valeur
    // sûre plutôt que d'inventer un thème.
    theme: "system",
    topP: legacy.defaultTopP ?? 0.9,
  };
}

type UserPreferencesPatch = Partial<{
  customInstructions: string;
  enabled: boolean;
  temperature: number;
  topP: number;
  defaultAgentId: string | null;
  // Menu favori : application ouverte par défaut après connexion.
  defaultApp: string;
  defaultCreationMode: "image" | "audio";
  defaultChatModel: string | null;
  defaultChatVisibility: "private" | "public";
  defaultDictationLanguage: string;
  defaultImageModel: string;
  defaultImageSize: string;
  defaultAudioModel: string;
  defaultAudioVoice: string;
  defaultAudioSpeed: number;
  defaultTranslationLanguage: string;
  ghostMemoryEnabled: boolean;
  pagesDefaultModel: string | null;
  pagesDefaultPrompt: string;
  showAgentChatIcons: boolean;
  /** Thème partagé : system | light | dark (normalisé à l'écriture). */
  theme: string;
  reasoningLevel: ReasoningLevel;
  /** Préférences de recherche mAI Search (migration 0062). */
  searchLanguage: MaiSearchLanguage;
  searchResultCount: number;
  searchSafetyLevel: MaiSearchSafetyLevel;
  searchSources: MaiSearchSourceKey[];
}>;

function isMissingUserPreferencesTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  return (
    code === "42P01" ||
    message.includes("user_preferences") ||
    message.includes("42P01")
  );
}

async function upsertLegacyUserPreferences(
  userId: string,
  data: UserPreferencesPatch
) {
  await dbReady();
  if (!_rawClient) {
    throw new Error("Postgres client indisponible.");
  }

  await _rawClient`
    INSERT INTO users (
      id, custom_instructions, custom_instructions_enabled, default_agent_id,
      default_audio_model, default_audio_speed, default_audio_voice,
      default_chat_model, default_chat_visibility, default_image_model,
      default_image_size, default_temperature, default_top_p,
      ghost_memory_enabled, show_agent_chat_icons
    )
    VALUES (
      ${userId}::uuid,
      ${data.customInstructions ?? ""},
      ${data.enabled ?? false},
      ${data.defaultAgentId ?? null}::uuid,
      ${data.defaultAudioModel ?? "deepgram/flux-tts:free"},
      ${data.defaultAudioSpeed ?? 1.0},
      ${data.defaultAudioVoice ?? "flux-alexis-en"},
      ${data.defaultChatModel ?? null},
      ${data.defaultChatVisibility ?? "private"},
      ${data.defaultImageModel ?? "black-forest-labs/flux-schnell"},
      ${data.defaultImageSize ?? "1024x1024"},
      ${data.temperature ?? 0.7},
      ${data.topP ?? 0.9},
      ${data.ghostMemoryEnabled ?? false},
      ${data.showAgentChatIcons ?? true}
    )
    ON CONFLICT (id) DO UPDATE SET
      custom_instructions = COALESCE(${data.customInstructions ?? null}, users.custom_instructions),
      custom_instructions_enabled = COALESCE(${data.enabled ?? null}, users.custom_instructions_enabled),
      default_agent_id = COALESCE(${data.defaultAgentId ?? null}::uuid, users.default_agent_id),
      default_audio_model = COALESCE(${data.defaultAudioModel ?? null}, users.default_audio_model),
      default_audio_speed = COALESCE(${data.defaultAudioSpeed ?? null}, users.default_audio_speed),
      default_audio_voice = COALESCE(${data.defaultAudioVoice ?? null}, users.default_audio_voice),
      default_chat_model = CASE WHEN ${data.defaultChatModel !== undefined} THEN ${data.defaultChatModel ?? null} ELSE users.default_chat_model END,
      default_chat_visibility = COALESCE(${data.defaultChatVisibility ?? null}, users.default_chat_visibility),
      default_image_model = COALESCE(${data.defaultImageModel ?? null}, users.default_image_model),
      default_image_size = COALESCE(${data.defaultImageSize ?? null}, users.default_image_size),
      default_temperature = COALESCE(${data.temperature ?? null}, users.default_temperature),
      default_top_p = COALESCE(${data.topP ?? null}, users.default_top_p),
      ghost_memory_enabled = COALESCE(${data.ghostMemoryEnabled ?? null}, users.ghost_memory_enabled),
      show_agent_chat_icons = COALESCE(${data.showAgentChatIcons ?? null}, users.show_agent_chat_icons),
      updated_at = NOW()
  `;

  const rows = await _rawClient`
    SELECT custom_instructions, custom_instructions_enabled, default_agent_id,
           default_audio_model, default_audio_speed, default_audio_voice,
           default_chat_model, default_chat_visibility, default_image_model,
           default_image_size, default_temperature, default_top_p,
           ghost_memory_enabled, show_agent_chat_icons
    FROM users WHERE id = ${userId}::uuid LIMIT 1
  `;
  const row = (rows as any[])[0];
  if (!row) {
    throw new ChatbotError("bad_request:database");
  }
  return {
    customInstructions: row.custom_instructions || "",
    customInstructionsEnabled: Boolean(row.custom_instructions_enabled),
    defaultAgentId: row.default_agent_id || null,
    defaultAudioModel: row.default_audio_model,
    defaultAudioSpeed: row.default_audio_speed,
    defaultAudioVoice: row.default_audio_voice,
    defaultChatModel: row.default_chat_model || null,
    defaultChatVisibility: row.default_chat_visibility,
    defaultImageModel: row.default_image_model,
    defaultImageSize: row.default_image_size,
    defaultTemperature: row.default_temperature,
    defaultTopP: row.default_top_p,
    ghostMemoryEnabled: Boolean(row.ghost_memory_enabled),
    showAgentChatIcons: row.show_agent_chat_icons ?? true,
    updatedAt: new Date(),
    userId,
  };
}

export async function upsertUserPreferences(
  userId: string,
  data: UserPreferencesPatch
) {
  const { userPreferences } = await import("../schema");

  try {
    const db = await dbReady();
    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(userPreferences)
        .values({
          customInstructions: data.customInstructions ?? "",
          customInstructionsEnabled: data.enabled ?? false,
          defaultAgentId: data.defaultAgentId ?? null,
          // La validité (mai | site | vibe | code) est imposée par le schéma
          // zod de la route ; ici on borne quand même la écriture : une valeur
          // inattendue vaut « mai », comme un tier illisible vaut free.
          defaultApp: normalizeAppKey(data.defaultApp),
          defaultAudioModel: data.defaultAudioModel ?? "deepgram/flux-tts:free",
          defaultAudioSpeed: data.defaultAudioSpeed ?? 1.0,
          defaultAudioVoice: data.defaultAudioVoice ?? "flux-alexis-en",
          defaultChatModel: data.defaultChatModel ?? null,
          defaultChatVisibility: data.defaultChatVisibility ?? "private",
          defaultCreationMode: normalizeCreationMode(data.defaultCreationMode),
          defaultDictationLanguage: normalizeDictationLanguage(
            data.defaultDictationLanguage
          ),
          defaultImageModel:
            data.defaultImageModel ?? "black-forest-labs/flux-schnell",
          defaultImageSize: data.defaultImageSize ?? "1024x1024",
          defaultTemperature: data.temperature ?? 0.7,
          defaultTopP: data.topP ?? 0.9,
          defaultTranslationLanguage:
            normalizeTranslationTarget(data.defaultTranslationLanguage) ??
            DEFAULT_TRANSLATION_TARGET,
          ghostMemoryEnabled: data.ghostMemoryEnabled ?? false,
          pagesDefaultModel: data.pagesDefaultModel?.trim() || null,
          pagesDefaultPrompt: data.pagesDefaultPrompt ?? "",
          reasoningLevel: data.reasoningLevel ?? "medium",
          searchLanguage: normalizeMaiSearchLanguage(data.searchLanguage),
          searchResultCount: normalizeMaiSearchResultCount(
            data.searchResultCount
          ),
          searchSafetyLevel: normalizeMaiSearchSafetyLevel(
            data.searchSafetyLevel
          ),
          searchSources: normalizeMaiSearchSources(data.searchSources),
          showAgentChatIcons: data.showAgentChatIcons ?? true,
          // Une valeur illisible retombe sur « system », comme un tier
          // illisible vaut free.
          theme: normalizeThemePreference(data.theme),
          userId,
        })
        .returning();
      return created;
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.customInstructions !== undefined)
      updatePayload.customInstructions = data.customInstructions;
    if (data.enabled !== undefined)
      updatePayload.customInstructionsEnabled = data.enabled;
    if (data.temperature !== undefined)
      updatePayload.defaultTemperature = data.temperature;
    if (data.topP !== undefined) updatePayload.defaultTopP = data.topP;
    if (data.defaultAgentId !== undefined)
      updatePayload.defaultAgentId = data.defaultAgentId;
    if (data.defaultApp !== undefined)
      updatePayload.defaultApp = normalizeAppKey(data.defaultApp);
    if (data.defaultCreationMode !== undefined) {
      updatePayload.defaultCreationMode = normalizeCreationMode(
        data.defaultCreationMode
      );
    }
    if (data.defaultChatModel !== undefined)
      updatePayload.defaultChatModel = data.defaultChatModel;
    if (data.defaultChatVisibility !== undefined)
      updatePayload.defaultChatVisibility = data.defaultChatVisibility;
    if (data.defaultDictationLanguage !== undefined)
      updatePayload.defaultDictationLanguage = normalizeDictationLanguage(
        data.defaultDictationLanguage
      );
    if (data.defaultImageModel !== undefined)
      updatePayload.defaultImageModel = data.defaultImageModel;
    if (data.defaultImageSize !== undefined)
      updatePayload.defaultImageSize = data.defaultImageSize;
    if (data.defaultAudioModel !== undefined)
      updatePayload.defaultAudioModel = data.defaultAudioModel;
    if (data.defaultAudioVoice !== undefined)
      updatePayload.defaultAudioVoice = data.defaultAudioVoice;
    if (data.defaultAudioSpeed !== undefined)
      updatePayload.defaultAudioSpeed = data.defaultAudioSpeed;
    if (data.defaultTranslationLanguage !== undefined)
      updatePayload.defaultTranslationLanguage =
        normalizeTranslationTarget(data.defaultTranslationLanguage) ??
        DEFAULT_TRANSLATION_TARGET;
    if (data.ghostMemoryEnabled !== undefined)
      updatePayload.ghostMemoryEnabled = data.ghostMemoryEnabled;
    if (data.pagesDefaultModel !== undefined) {
      updatePayload.pagesDefaultModel = data.pagesDefaultModel?.trim() || null;
    }
    if (data.pagesDefaultPrompt !== undefined) {
      updatePayload.pagesDefaultPrompt = data.pagesDefaultPrompt;
    }
    if (data.showAgentChatIcons !== undefined)
      updatePayload.showAgentChatIcons = data.showAgentChatIcons;
    if (data.theme !== undefined)
      updatePayload.theme = normalizeThemePreference(data.theme);
    if (data.reasoningLevel !== undefined)
      updatePayload.reasoningLevel = data.reasoningLevel;
    if (data.searchLanguage !== undefined)
      updatePayload.searchLanguage = normalizeMaiSearchLanguage(
        data.searchLanguage
      );
    if (data.searchResultCount !== undefined)
      updatePayload.searchResultCount = normalizeMaiSearchResultCount(
        data.searchResultCount
      );
    if (data.searchSafetyLevel !== undefined)
      updatePayload.searchSafetyLevel = normalizeMaiSearchSafetyLevel(
        data.searchSafetyLevel
      );
    if (data.searchSources !== undefined)
      updatePayload.searchSources = normalizeMaiSearchSources(
        data.searchSources
      );

    const [updated] = await db
      .update(userPreferences)
      .set(updatePayload)
      .where(eq(userPreferences.userId, userId))
      .returning();

    return updated;
  } catch (error) {
    // Les anciens comptes ne peuvent pas enregistrer ce nouveau champ sans migration.
    if (
      data.defaultCreationMode !== undefined ||
      !isMissingUserPreferencesTable(error)
    ) {
      throw error;
    }
    console.warn(
      "user_preferences indisponible, écriture de transition vers users:",
      error
    );
    return upsertLegacyUserPreferences(userId, data);
  }
}

export async function getUserModelPreferences(userId: string): Promise<{
  customInstructions: string | null;
  customInstructionsEnabled: boolean;
  defaultChatModel: string | null;
  defaultTemperature: number | null;
  defaultTopP: number | null;
  reasoningLevel: ReasoningLevel | null;
}> {
  const empty = {
    customInstructions: null,
    customInstructionsEnabled: false,
    defaultChatModel: null,
    defaultTemperature: null,
    defaultTopP: null,
    reasoningLevel: null,
  };

  // Source canonique : les préférences écrites par /api/user/preferences.
  // Le fallback users ci-dessous est conservé pendant la transition afin de ne
  // pas perdre les préférences des environnements dont la migration n'est pas
  // encore appliquée.
  try {
    const db = await dbReady();
    const { userPreferences } = await import("../schema");
    const [row] = await db
      .select({
        customInstructions: userPreferences.customInstructions,
        customInstructionsEnabled: userPreferences.customInstructionsEnabled,
        defaultChatModel: userPreferences.defaultChatModel,
        defaultTemperature: userPreferences.defaultTemperature,
        defaultTopP: userPreferences.defaultTopP,
        reasoningLevel: userPreferences.reasoningLevel,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    if (row) {
      return {
        customInstructions: row.customInstructions || null,
        customInstructionsEnabled: Boolean(row.customInstructionsEnabled),
        defaultChatModel: row.defaultChatModel ?? null,
        defaultTemperature: row.defaultTemperature ?? null,
        defaultTopP: row.defaultTopP ?? null,
        reasoningLevel: (row.reasoningLevel as ReasoningLevel) ?? null,
      };
    }
  } catch (error) {
    // Une base ancienne peut ne pas encore connaître user_preferences.
    console.warn("getUserModelPreferences canonical read skipped:", error);
  }

  try {
    if (!_rawClient) {
      return empty;
    }
    const rows = await _rawClient`
      SELECT custom_instructions, custom_instructions_enabled, default_temperature, default_top_p FROM users
      WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text
      LIMIT 1`;
    const row = (rows as any[])[0];
    if (!row) {
      return empty;
    }
    return {
      customInstructions: row.custom_instructions || null,
      customInstructionsEnabled: Boolean(row.custom_instructions_enabled),
      defaultChatModel: null,
      defaultTemperature: row.default_temperature ?? null,
      defaultTopP: row.default_top_p ?? null,
      reasoningLevel: null,
    };
  } catch {
    return empty;
  }
}
