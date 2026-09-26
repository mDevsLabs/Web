import type { Hono } from "npm:hono@4";
import {
  extractToken,
  getDb,
  getTierMaiTokenLimit,
  getTierSpeechLimit,
  getUserQuotaBoost,
  getWeekData,
  isPaidTier,
  verifyToken,
} from "./config.ts";
import { maiModelsList } from "./maiModels.ts";

function getOpenRouterApiKey(userCustomKey?: string | null): string {
  if (userCustomKey && userCustomKey.trim().startsWith("sk-or-")) {
    return userCustomKey.trim();
  }
  return Deno.env.get("OPENROUTER_API_KEY") || "";
}

// ─────────────────────────────────────────────
// Alias cloud mAI-2 -> backends OpenRouter (cachés aux utilisateurs).
// mAI-2      -> DeepSeek V4 Flash 0731 (1.3M ctx / 384k out)
// mAI-2-Mini -> MiniMax M3 (1M ctx / 128k out)
// Disponibles pour tous les plans (Free, Plus, Pro, Max).
// ─────────────────────────────────────────────
const MAI_CLOUD_ALIASES: Record<string, string> = {
  "mai-2": "deepseek/deepseek-v4-flash-0731",
  "mai-2-mini": "minimax/minimax-m3",
};

function normalizeMaiAliasId(model?: string | null): string {
  let m = String(model || "")
    .toLowerCase()
    .trim();
  if (m.startsWith("mdevslabs/")) m = m.slice("mdevslabs/".length);
  return m;
}

function resolveMaiCloudBackend(model?: string | null): string | null {
  return MAI_CLOUD_ALIASES[normalizeMaiAliasId(model)] || null;
}

// ─────────────────────────────────────────────
// Les variantes ":batch" (ex: "openai/gpt-4o:batch") sont des endpoints
// d'asynchrone/batch facturés à part : on ne les expose jamais dans
// /v1/models pour éviter de renvoyer des modèles inutilisables en chat.
// ─────────────────────────────────────────────
function isBatchVariantId(id?: string | null): boolean {
  return String(id || "")
    .trim()
    .toLowerCase()
    .endsWith(":batch");
}

// ─────────────────────────────────────────────
// Capacités de réflexion.
//
// L'application ne définit AUCUNE liste de niveaux : elle lit
// `reasoning.supported_efforts` dans le catalogue OpenRouter. Toute la
// normalisation happen ici, une fois pour tous les appelants.
//
// Forme relevée sur GET /v1/models :
//   reasoning: { mandatory, default_enabled?, default_effort?, supported_efforts? }
// `supported_efforts` est absent sur les modèles qui raisonnent sans exposer de
// niveaux (ex. minimax/minimax-m3, alias mAI-2-Mini) : ce n'est pas une absence
// de donnée, c'est l'information « ce niveau n'est pas contrôlable ».
// ─────────────────────────────────────────────
const REASONING_EFFORT_ORDER = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

function normalizeReasoningMetadata(raw: any) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const efforts = Array.isArray(raw.supported_efforts)
    ? raw.supported_efforts
        .map((value: unknown) => String(value).trim().toLowerCase())
        .filter((value: string) => REASONING_EFFORT_ORDER.includes(value))
    : undefined;
  const defaultEffort =
    typeof raw.default_effort === "string" &&
    REASONING_EFFORT_ORDER.includes(raw.default_effort.trim().toLowerCase())
      ? raw.default_effort.trim().toLowerCase()
      : undefined;

  const normalized: Record<string, unknown> = {
    mandatory: raw.mandatory === true,
  };
  if (typeof raw.default_enabled === "boolean") {
    normalized.default_enabled = raw.default_enabled;
  }
  // Liste absente = aucune liste : on ne la remplace surtout pas par des
  // valeurs par défaut, l'interface proposerait alors un sélecteur que le
  // modèle refuse.
  if (efforts && efforts.length > 0) {
    normalized.supported_efforts = Array.from(new Set(efforts));
  }
  // Un défaut hors de la liste du modèle serait ignoré par le client ; on ne le
  // propage donc que s'il est réellement proposé.
  if (defaultEffort && (!efforts || efforts.includes(defaultEffort))) {
    normalized.default_effort = defaultEffort;
  }
  return normalized;
}

// Les alias cloud mAI-2 sont exposés sous leur nom public, mais leur backend
// OpenRouter est caché. Les capacités de réflexion doivent malgré tout être
//those du backend réel : sans cela mAI-2 perdrait son sélecteur alors que
// deepseek-v4-flash-0731 en expose trois niveaux.
function buildMaiCloudPublicModels(
  nowSec: number,
  backendReasoning?: Map<string, any>
) {
  const defs = maiModelsList.filter(
    (m) => resolveMaiCloudBackend(m.id) !== null
  );
  return defs.map((m) => {
    const backend = resolveMaiCloudBackend(m.id);
    const reasoning = backendReasoning?.get(backend ?? "") ?? null;
    return {
      architecture: {
        input_modalities: ["text"],
        modality: "text->text",
        output_modalities: ["text"],
      },
      created: Math.floor(new Date(m.releaseDate).getTime() / 1000) || nowSec,
      description: m.description || "",
      id: m.id,
      maxContext: m.contextWindow,
      maxOutput: m.maxOutputTokens,
      name: m.name,
      object: "model",
      owned_by: "mDevsLabs",
      reasoning: reasoning ?? null,
      supported_parameters: reasoning
        ? [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
            "reasoning",
            "include_reasoning",
            ...(reasoning.supported_efforts ? ["reasoning_effort"] : []),
          ]
        : [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
    };
  });
}

// Le provider AI SDK sérialise l'effort sous la clé historique `reasoning_effort`
// (il valide la valeur contre un enum qui contient exactement les sept niveaux de
// l'API OpenRouter). OpenRouter expose aujourd'hui la forme unifiée
// `reasoning: { effort }`. Traduire ici plutôt que dans chaque appelant : les
// trois routes de génération passent par ce proxy, c'est le seul point où le
// corps est encore sous notre contrôle.
function normalizeReasoningPayload(body: Record<string, any>) {
  const effort = body.reasoning_effort;
  if (typeof effort !== "string" || !REASONING_EFFORT_ORDER.includes(effort)) {
    return;
  }
  // Un `reasoning` explicite déjà présent reste prioritaire : le client peut
  // vouloir piloter `max_tokens` ou `exclude` en plus de l'effort.
  if (body.reasoning && typeof body.reasoning === "object") {
    return;
  }
  body.reasoning = { effort };
  delete body.reasoning_effort;
}

export function registerModelRoutes(app: Hono) {
  // ─────────────────────────────────────────────
  // GET /v1/usage & /usage
  // ─────────────────────────────────────────────
  const handleGetUsage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw) || (c as any).get?.("apiKey");
      let userId = (c as any).get?.("userId");

      if (token) {
        try {
          const payload = await verifyToken(token);
          userId = (payload.sub as string) || userId;
        } catch {}
      }

      const sql = getDb();

      // Résolution de l'identifiant via mprojects_api_keys si clé API fournie
      if (token) {
        try {
          const keyRows = await sql`
            SELECT k.user_id, u.tier, u.email, u.username
            FROM mprojects_api_keys k
            LEFT JOIN users u ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
            WHERE k.api_key = ${token}::text
            LIMIT 1
          `;
          if (keyRows.length > 0) {
            userId = keyRows[0].user_id;
          }
        } catch {}
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const { weekStartStr, nextResetIso } = getWeekData();

      const userResult =
        await sql`SELECT id, tier, email, username, phone, avatar_url FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`;
      const user = userResult[0];
      const resolvedUserId = user ? user.id : userId;

      const [usageResult, speechResult] = await Promise.all([
        sql`
          SELECT COALESCE(SUM(tokens_used::numeric), 0) as tokens_used 
          FROM weekly_usage 
          WHERE user_id = ${resolvedUserId}::integer AND week_start = ${weekStartStr}::date
        `.catch((e) => {
          console.error("[usageResult] Error:", e);
          return [];
        }),
        sql`
          SELECT COALESCE(SUM(tokens_used::numeric), 0) as tokens_used 
          FROM weekly_speech_usage 
          WHERE user_id = ${resolvedUserId}::text AND week_start = ${weekStartStr}::date
        `.catch((e) => {
          console.error("[speechResult] Error:", e);
          return [];
        }),
      ]);
      const tokensUsed = usageResult[0]?.tokens_used || 0;
      const speechTokensUsed = Number(speechResult?.[0]?.tokens_used || 0);
      const userTier = user?.tier || "Free";
      const maiBoost = await getUserQuotaBoost(sql, resolvedUserId, "mai");
      const audioBoost = await getUserQuotaBoost(sql, resolvedUserId, "audio");
      const limit = getTierMaiTokenLimit(userTier) + maiBoost;
      const speechLimit = getTierSpeechLimit(userTier) + audioBoost;

      return c.json({
        avatarUrl: user?.avatar_url,
        email: user?.email,
        id: userId,
        limit,
        phone: user?.phone,
        resetAt: nextResetIso,
        speechLimit,
        speechTokensUsed,
        tier: userTier,
        tokensUsed,
        username: user?.username,
        weekStart: weekStartStr,
      });
    } catch {
      return c.json({ error: "Erreur serveur." }, 500);
    }
  };

  app.get("/usage", handleGetUsage);
  app.get("/v1/usage", handleGetUsage);
  app.get("/usage/", handleGetUsage);
  app.get("/v1/usage/", handleGetUsage);

  // ─────────────────────────────────────────────
  // POST /v1/log-usage & /log-usage
  // ─────────────────────────────────────────────
  const handleLogUsage = async (c: any) => {
    try {
      const token = extractToken(c.req.raw) || (c as any).get?.("apiKey");
      let userId = (c as any).get?.("userId");

      if (token) {
        try {
          const payload = await verifyToken(token);
          userId = (payload.sub as string) || userId;
        } catch {}
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const body = await c.req.json().catch(() => ({}));
      const inputTokens = Number(body.inputTokens || body.promptTokens || 0);
      const outputTokens = Number(
        body.outputTokens || body.completionTokens || 0
      );
      const reasoningTokens = Number(body.reasoningTokens || 0);

      // `reasoning_tokens` est un SOUS-ENSEMBLE de `completion_tokens` : le
      // fournisseur le facture déjà dans la sortie. L'AI SDK le sort de
      // `outputTokens` (text = completion − reasoning), d'où la base
      // input + output ici. On ne l'ajoute que si l'appelant ne l'a pas déjà
      // compté dans `tokensUsed`, sinon la réflexion serait facturée deux fois.
      const declaredTokensUsed = Number(body.tokensUsed || 0);
      const baseTokens = inputTokens + outputTokens;
      const alreadyCounted =
        declaredTokensUsed > 0 && declaredTokensUsed >= baseTokens;
      const tokensUsed =
        declaredTokensUsed > 0
          ? declaredTokensUsed
          : baseTokens +
            (reasoningTokens > 0 && !alreadyCounted ? reasoningTokens : 0);
      const { weekStartStr } = getWeekData();

      const sql = getDb();
      const userRes =
        await sql`SELECT id, tier FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text LIMIT 1`;
      const tier = userRes.length > 0 ? userRes[0].tier : "Free";
      const resolvedUserId = userRes.length > 0 ? userRes[0].id : userId;
      const maiBoost = await getUserQuotaBoost(sql, resolvedUserId, "mai");
      const limit = getTierMaiTokenLimit(tier) + maiBoost;

      const usageResult = await sql`
        SELECT tokens_used FROM weekly_usage
        WHERE user_id = ${resolvedUserId}::integer AND week_start = ${weekStartStr}::date
        LIMIT 1
      `;
      const currentUsage = usageResult[0]?.tokens_used || 0;

      await sql`
        INSERT INTO weekly_usage (user_id, week_start, tokens_used)
        VALUES (${resolvedUserId}::integer, ${weekStartStr}::date, ${tokensUsed})
        ON CONFLICT (user_id, week_start)
        DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${tokensUsed}
      `;

      return c.json({
        inputTokens,
        limit,
        outputTokens,
        reasoningTokens,
        success: true,
        tokensUsed,
        weeklyUsed: currentUsage + tokensUsed,
      });
    } catch (err: any) {
      console.error("[log-usage] Error:", err);
      return c.json({ details: err?.message, error: "Erreur serveur." }, 500);
    }
  };

  app.post("/log-usage", handleLogUsage);
  app.post("/v1/log-usage", handleLogUsage);
  app.post("/log-usage/", handleLogUsage);
  app.post("/v1/log-usage/", handleLogUsage);

  // ─────────────────────────────────────────────
  // GET /v1/models, /models & /v1beta/models
  // ─────────────────────────────────────────────
  const handleGetModels = async (c: any) => {
    const userPlan = c.get("userPlan");
    const shouldFilterFreeOnly = !isPaidTier(userPlan);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      if (!res.ok) {
        throw new Error("OpenRouter fetch error");
      }
      const json = await res.json();
      const rawModels: any[] = json.data || [];

      let filtered = rawModels
        .filter((m) => m && m.id && !m.id.startsWith("openrouter/"))
        .filter((m) => !isBatchVariantId(m.id))
        .filter((m) => {
          const modality = m.architecture?.modality || "";
          const outputModalities = m.architecture?.output_modalities || [];
          return (
            outputModalities.includes("text") ||
            modality.endsWith("text") ||
            modality.includes("->text")
          );
        })
        .map((m) => ({
          architecture: m.architecture,
          created: m.created || Math.floor(Date.now() / 1000),
          description: m.description || "",
          id: m.id,
          maxContext: m.context_length || 128_000,
          maxOutput: m.top_provider?.max_completion_tokens || 4096,
          name: m.name || m.id,
          object: "model",
          owned_by: m.id.split("/")[0] || "openrouter",
          // Capacités de réflexion normalisées. Ce champ est ce qui permet à
          // l'application d'afficher les niveaux réellement compatibles avec le
          // modèle sélectionné, sans liste en dur : si OpenRouter ajoute,
          // retire ou change un niveau, l'interface suit au prochain
          // rechargement du catalogue.
          reasoning: normalizeReasoningMetadata(m.reasoning),
          supported_parameters: m.supported_parameters || [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
        }));

      if (shouldFilterFreeOnly) {
        filtered = filtered.filter((m) =>
          (m.id || "").toLowerCase().includes(":free")
        );
      }

      const lagunaIdx = filtered.findIndex(
        (m) => m.id === "poolside/laguna-xs-2.1:free"
      );
      if (lagunaIdx > 0) {
        const [laguna] = filtered.splice(lagunaIdx, 1);
        filtered.unshift(laguna);
      }

      // Injecter les alias cloud mAI-2 (visibles pour tous les plans,
      // après le filtre :free — backend OpenRouter caché).
      //
      // Le backend est masqué, mais ses capacités de réflexion sont recopiées :
      // mAI-2 est adossé à deepseek-v4-flash-0731, qui propose trois niveaux
      // (max/high/low). Sans cette table, l'alias perdrait son sélecteur alors
      // que le modèle sous-jacent en accepte un.
      try {
        const nowSec = Math.floor(Date.now() / 1000);
        const backendReasoning = new Map<string, any>();
        for (const m of rawModels) {
          if (m?.id && m?.reasoning) {
            backendReasoning.set(m.id, normalizeReasoningMetadata(m.reasoning));
          }
        }
        const cloudModels = buildMaiCloudPublicModels(
          nowSec,
          backendReasoning
        ).filter((cm) => !filtered.some((m) => m.id === cm.id));
        filtered.unshift(...cloudModels);
      } catch {}

      return c.json({ data: filtered, object: "list" });
    } catch (_err) {
      // Catalogue de repli, servi uniquement quand l'appel à OpenRouter échoue :
      // le chemin nominal est le proxy du catalogue live décrit plus haut. Ces
      // entrées ne sont donc pas une source de vérité sur les capacités
      // réelles, mais ce que l'interface doit savoir afficher quand le
      // fournisseur est injoignable. L'identifiant doit malgré tout exister
      // côté OpenRouter, sans quoi la requête part en erreur.
      let fallback = [
        {
          architecture: {
            input_modalities: ["text"],
            modality: "text->text",
            output_modalities: ["text"],
          },
          created: 0,
          description:
            "Modèle de raisonnement NVIDIA de très grande taille, pour le raisonnement long et les tâches complexes sur un contexte de 1M tokens.",
          id: "nvidia/nemotron-3-ultra-550b-a55b:free",
          maxContext: 1_000_000,
          maxOutput: 4096,
          name: "NVIDIA: Nemotron 3 Ultra 550B A55B",
          object: "model",
          owned_by: "nvidia",
          supported_parameters: [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
        },
        {
          architecture: {
            input_modalities: ["text"],
            modality: "text->text",
            output_modalities: ["text"],
          },
          created: 0,
          description:
            "Modèle IA Laguna XS 2.1 haute performance par Poolside",
          id: "poolside/laguna-xs-2.1:free",
          maxContext: 128_000,
          maxOutput: 4096,
          name: "Laguna XS 2.1",
          object: "model",
          owned_by: "poolside",
          supported_parameters: [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
        },
        {
          architecture: {
            input_modalities: ["text"],
            modality: "text->text",
            output_modalities: ["text"],
          },
          created: 0,
          description:
            "Modèle IA Laguna S 2.1 par Poolside, pour le développement et l'exécution de code sur un contexte de 262K tokens.",
          id: "poolside/laguna-s-2.1:free",
          maxContext: 262_144,
          maxOutput: 8192,
          name: "Poolside: Laguna S 2.1",
          object: "model",
          owned_by: "poolside",
          supported_parameters: [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
        },
        {
          architecture: {
            input_modalities: ["text"],
            modality: "text->text",
            output_modalities: ["text"],
          },
          created: 0,
          description:
            "Modèle NVIDIA Nemotron 3.5 Lightning, optimisé pour la latence sur un contexte de 1M tokens.",
          id: "nvidia/nemotron-3.5-lightning:free",
          maxContext: 1_000_000,
          maxOutput: 65_536,
          name: "NVIDIA: Nemotron 3.5 Lightning",
          object: "model",
          owned_by: "nvidia",
          supported_parameters: [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
        },
        {
          architecture: {
            input_modalities: ["text"],
            modality: "text->text",
            output_modalities: ["text"],
          },
          created: 0,
          description:
            "Modèle Thinking Machines Inkling, sur un contexte de 1M tokens.",
          id: "thinkingmachines/inkling:free",
          maxContext: 1_000_000,
          maxOutput: 65_536,
          name: "Thinking Machines: Inkling",
          object: "model",
          owned_by: "thinkingmachines",
          supported_parameters: [
            "temperature",
            "top_p",
            "max_tokens",
            "stream",
            "stop",
            "tools",
            "response_format",
          ],
        },
      ];

      if (shouldFilterFreeOnly) {
        fallback = fallback.filter((m) =>
          (m.id || "").toLowerCase().includes(":free")
        );
      }

      fallback = fallback.filter((m) => !isBatchVariantId(m.id));

      try {
        const cloudModels = buildMaiCloudPublicModels(0).filter(
          (cm) => !fallback.some((m) => m.id === cm.id)
        );
        fallback.unshift(...cloudModels);
      } catch {}

      return c.json({ data: fallback, object: "list" });
    }
  };

  app.get("/v1/models", handleGetModels);
  app.get("/models", handleGetModels);
  app.get("/v1beta/models", handleGetModels);

  // ─────────────────────────────────────────────
  // GET /v1/models/mai & GET /v1/mai/models
  // ─────────────────────────────────────────────
  const handleGetMaiModels = (c: any) => {
    const formatted = maiModelsList.map((m) => {
      // Modèles cloud mAI-2 : réponse épurée (pas de parameters/hardware).
      if (resolveMaiCloudBackend(m.id) !== null) {
        return {
          description: m.description,
          id: m.id,
          name: m.name,
          object: "model",
          status: m.status,
        };
      }
      return {
        capabilities: m.capabilities,
        context_length: m.contextWindow,
        created:
          Math.floor(new Date(m.releaseDate).getTime() / 1000) ||
          Math.floor(Date.now() / 1000),
        description: m.description,
        huggingface_tag: m.huggingFaceTag,
        id: m.id,
        license: m.license,
        max_output_tokens: m.maxOutputTokens,
        name: m.name,
        object: "model",
        ollama_tag: m.ollamaTag,
        owned_by: "mDevsLabs",
        parameters: m.parameters,
        recommended_hardware: m.recommendedHardware,
        status: m.status,
        tagline: m.tagline,
        usable_in_cloud_chat: false,
        version: m.version,
      };
    });
    return c.json({ data: formatted, object: "list" });
  };

  app.get("/v1/models/mai", handleGetMaiModels);
  app.get("/v1/mai/models", handleGetMaiModels);
  app.get("/models/mai", handleGetMaiModels);
  app.get("/mai/models", handleGetMaiModels);

  // ─────────────────────────────────────────────
  // GET /v1/status
  // ─────────────────────────────────────────────
  const handleGetStatus = async (c: any) => {
    try {
      const res = await fetch("https://mai.instatus.com/summary.json");
      const data = await res.json();
      return c.json(data);
    } catch {
      return c.json({ error: "Failed to fetch status" }, 500);
    }
  };

  app.get("/v1/status", handleGetStatus);
  app.get("/status", handleGetStatus);

  // ─────────────────────────────────────────────
  // POST /v1/chat/completions & /chat/completions (OpenAI Compatible)
  // ─────────────────────────────────────────────
  const handleChatCompletions = async (c: any) => {
    try {
      const userPlan = c.get("userPlan") || "Free";

      let body: Record<string, any>;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          {
            error: {
              code: "invalid_request_body",
              message: "Le corps de la requête doit être un JSON valide.",
              type: "invalid_request_error",
            },
          },
          400
        );
      }

      const modelRequested = body.model;
      if (!modelRequested) {
        return c.json(
          {
            error: {
              code: "missing_model",
              message: "Le paramètre 'model' est obligatoire.",
              param: "model",
              type: "invalid_request_error",
            },
          },
          400
        );
      }
      const modelStr = String(modelRequested).toLowerCase().trim();
      // Alias cloud mAI-2 : autorisés en chat cloud pour tous les plans,
      // transférés vers OpenRouter en arrière-plan (backend caché).
      const maiCloudBackend = resolveMaiCloudBackend(modelRequested);

      // Vérifier si c'est un modèle mAI (local uniquement)
      const isMaiLocal =
        (modelStr.startsWith("mai-") ||
          modelStr.startsWith("mdevslabs/") ||
          modelStr.includes("mai-1.") ||
          modelStr === "mai-1" ||
          modelStr === "mai-1-light") &&
        !maiCloudBackend;

      if (isMaiLocal) {
        return c.json(
          {
            error: {
              code: "mai_model_not_supported_for_cloud_chat",
              message: `Le modèle '${modelRequested}' est un modèle mAI destiné à une exécution locale (via Ollama / HuggingFace) et n'est pas directement utilisable en chat completions cloud.`,
              param: "model",
              type: "invalid_request_error",
            },
          },
          400
        );
      }

      const isFreePlan = !isPaidTier(userPlan);
      const isFreeModel = modelStr.includes(":free");
      const isMaiCloudAlias = maiCloudBackend !== null;

      // Bloquer avec 403 les requêtes pour les modèles payants avec une clé ou JWT free
      // Exception : alias cloud mAI-2 disponibles pour tous les plans.
      if (isFreePlan && !isFreeModel && !isMaiCloudAlias) {
        return c.json(
          {
            error: {
              code: "model_access_denied",
              message: `Le modèle '${modelRequested || "inconnu"}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${userPlan}) autorise uniquement les modèles contenant ':free' dans leur identifiant (ex: 'google/gemini-2.5-flash:free', 'meta-llama/llama-3.3-70b-instruct:free').`,
              param: "model",
              type: "permission_error",
            },
          },
          403
        );
      }

      let userId = c.get("userId");
      if (!userId) {
        const token = extractToken(c.req.raw);
        if (token) {
          try {
            const payload = await verifyToken(token);
            userId = payload.sub as string;
          } catch {}
        }
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const sql = getDb();
      const { weekStartStr } = getWeekData();
      const usageResult = await sql`
        SELECT tokens_used FROM weekly_usage
        WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date
        LIMIT 1
      `;
      const currentUsage = usageResult[0]?.tokens_used || 0;
      const maiBoost = await getUserQuotaBoost(sql, userId, "mai");
      const limit = getTierMaiTokenLimit(userPlan) + maiBoost;

      if (currentUsage >= limit) {
        return c.json(
          { error: "Votre limite hebdomadaire est épuisée. Quota atteint." },
          429
        );
      }

      const keyRows = await sql`
        SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${userId}::text LIMIT 1
      `;
      const apiKey = getOpenRouterApiKey(
        keyRows.length > 0 ? keyRows[0].api_key : null
      );

      if (!apiKey) {
        return c.json({ error: "Clé fournisseur OpenRouter manquante." }, 500);
      }

      // Nettoyer le body : retirer tout champ `api_key` ou `Authorization` injecté par le client
      // pour empêcher tout contournement de la clé serveur.
      const {
        api_key: _ck,
        authorization: _ca,
        Authorization: _cA,
        ...safeBody
      } = body as Record<string, any>;

      // Transférer l'alias mAI-2 vers le backend OpenRouter réel (caché).
      if (maiCloudBackend) {
        safeBody.model = maiCloudBackend;
      }
      normalizeReasoningPayload(safeBody);

      const openRouterRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          body: JSON.stringify(safeBody),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mai.val.run",
            "X-Title": "mAI Public API",
          },
          method: "POST",
        }
      );

      if (openRouterRes.status === 200) {
        try {
          await sql`
            INSERT INTO weekly_usage (user_id, week_start, tokens_used)
            VALUES (${userId}::integer, ${weekStartStr}::date, 1)
            ON CONFLICT (user_id, week_start)
            DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
          `;
        } catch (_e) {}
      }

      return new Response(openRouterRes.body, {
        headers: {
          "Content-Type":
            openRouterRes.headers.get("Content-Type") || "application/json",
        },
        status: openRouterRes.status,
      });
    } catch (err: any) {
      console.error("[ChatCompletions] Erreur inattendue:", err);
      return c.json(
        {
          details: err?.message || "Erreur interne.",
          error: "Failed to process chat completion.",
        },
        500
      );
    }
  };

  app.post("/v1/chat/completions", handleChatCompletions);
  app.post("/chat/completions", handleChatCompletions);

  // ─────────────────────────────────────────────
  // POST /v1/messages & /messages (Proxy Anthropic SDK)
  // ─────────────────────────────────────────────
  const handleMessages = async (c: any) => {
    try {
      const userPlan = c.get("userPlan") || "Free";

      let body: Record<string, any>;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          {
            error: {
              code: "invalid_request_body",
              message: "Le corps de la requête doit être un JSON valide.",
              type: "invalid_request_error",
            },
          },
          400
        );
      }

      const modelRequested = body.model;
      const modelStr = String(modelRequested || "")
        .toLowerCase()
        .trim();
      const maiCloudBackend = resolveMaiCloudBackend(modelRequested);

      const isFreePlan = !isPaidTier(userPlan);
      const isFreeModel = modelStr.includes(":free");
      const isMaiCloudAlias = maiCloudBackend !== null;

      // Bloquer avec 403 les requêtes pour les modèles payants avec une clé ou JWT free
      // Exception : alias cloud mAI-2 disponibles pour tous les plans.
      if (isFreePlan && !isFreeModel && !isMaiCloudAlias) {
        return c.json(
          {
            error: {
              code: "model_access_denied",
              message: `Le modèle '${modelRequested || "inconnu"}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${userPlan}) autorise uniquement les modèles gratuits dont l'ID contient ':free' (ex: 'meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free').`,
              param: "model",
              type: "permission_error",
            },
          },
          403
        );
      }

      let userId = c.get("userId");
      if (!userId) {
        const token = extractToken(c.req.raw);
        if (token) {
          try {
            const payload = await verifyToken(token);
            userId = payload.sub as string;
          } catch {}
        }
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const sql = getDb();
      const { weekStartStr } = getWeekData();
      const usageResult = await sql`
        SELECT tokens_used FROM weekly_usage
        WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date
        LIMIT 1
      `;
      const currentUsage = usageResult[0]?.tokens_used || 0;
      const maiBoost = await getUserQuotaBoost(sql, userId, "mai");
      const limit = getTierMaiTokenLimit(userPlan) + maiBoost;

      if (currentUsage >= limit) {
        return c.json(
          { error: "Votre limite hebdomadaire est épuisée. Quota atteint." },
          429
        );
      }

      const keyRows = await sql`
        SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${userId}::text LIMIT 1
      `;
      const apiKey = getOpenRouterApiKey(
        keyRows.length > 0 ? keyRows[0].api_key : null
      );

      if (!apiKey) {
        return c.json({ error: "Clé fournisseur OpenRouter manquante." }, 500);
      }

      // Nettoyer le body : retirer tout champ `api_key` ou `Authorization` injecté par le client
      const {
        api_key: _ck,
        authorization: _ca,
        Authorization: _cA,
        ...safeBody
      } = body as Record<string, any>;

      if (maiCloudBackend) {
        safeBody.model = maiCloudBackend;
      }
      normalizeReasoningPayload(safeBody);

      const openRouterRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          body: JSON.stringify(safeBody),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mai.val.run",
            "X-Title": "mAI Public API (Anthropic)",
          },
          method: "POST",
        }
      );

      if (openRouterRes.status === 200) {
        try {
          await sql`
            INSERT INTO weekly_usage (user_id, week_start, tokens_used)
            VALUES (${userId}::integer, ${weekStartStr}::date, 1)
            ON CONFLICT (user_id, week_start)
            DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
          `;
        } catch (_e) {}
      }

      return new Response(openRouterRes.body, {
        headers: {
          "Content-Type":
            openRouterRes.headers.get("Content-Type") || "application/json",
        },
        status: openRouterRes.status,
      });
    } catch (err: any) {
      console.error("[Messages] Erreur inattendue:", err);
      return c.json(
        {
          details: err?.message || "Erreur interne.",
          error: "Failed to process Anthropic request.",
        },
        500
      );
    }
  };

  app.post("/v1/messages", handleMessages);
  app.post("/messages", handleMessages);

  // ─────────────────────────────────────────────
  // POST /v1beta/models/* & /v1/models/* (Proxy Google Gemini SDK)
  // ─────────────────────────────────────────────
  const handleGeminiGenerate = async (c: any) => {
    try {
      const userPlan = c.get("userPlan") || "Free";

      // Pour Gemini, le body JSON peut être optionnel (le modèle est dans l'URL)
      let body: Record<string, any> = {};
      try {
        body = await c.req.json();
      } catch {
        // body vide acceptable pour Gemini (modèle dans le path)
      }

      const fullPath = c.req.path;
      // Extraire le modèle depuis l'URL (ex: /v1beta/models/google/gemini-2.5-flash:free:generateContent -> google/gemini-2.5-flash:free)
      const pathModel = fullPath
        .replace(/^\/(v1beta|v1)\/models\//, "")
        .replace(/:(generateContent|streamGenerateContent).*$/, "");

      const paramModel = c.req.param("model");
      const modelRequested = body.model || paramModel || pathModel;
      const modelStr = String(modelRequested || "")
        .toLowerCase()
        .trim();
      const maiCloudBackend = resolveMaiCloudBackend(modelRequested);

      const isFreePlan = !isPaidTier(userPlan);
      const isFreeModel = modelStr.includes(":free");
      const isMaiCloudAlias = maiCloudBackend !== null;

      // Bloquer avec 403 les requêtes pour les modèles payants avec une clé ou JWT free
      // Exception : alias cloud mAI-2 disponibles pour tous les plans.
      if (isFreePlan && !isFreeModel && !isMaiCloudAlias) {
        return c.json(
          {
            error: {
              code: 403,
              message: `Le modèle '${modelRequested || "inconnu"}' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${userPlan}) autorise uniquement les modèles gratuits contenant ':free' dans leur identifiant (ex: 'google/gemini-2.5-flash:free').`,
              status: "PERMISSION_DENIED",
            },
          },
          403
        );
      }

      let userId = c.get("userId");
      if (!userId) {
        const token = extractToken(c.req.raw);
        if (token) {
          try {
            const payload = await verifyToken(token);
            userId = payload.sub as string;
          } catch {}
        }
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const sql = getDb();
      const { weekStartStr } = getWeekData();
      const usageResult = await sql`
        SELECT tokens_used FROM weekly_usage
        WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date
        LIMIT 1
      `;
      const currentUsage = usageResult[0]?.tokens_used || 0;
      const maiBoost = await getUserQuotaBoost(sql, userId, "mai");
      const limit = getTierMaiTokenLimit(userPlan) + maiBoost;

      if (currentUsage >= limit) {
        return c.json(
          { error: "Votre limite hebdomadaire est épuisée. Quota atteint." },
          429
        );
      }

      const keyRows = await sql`
        SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${userId}::text LIMIT 1
      `;
      const apiKey = getOpenRouterApiKey(
        keyRows.length > 0 ? keyRows[0].api_key : null
      );

      if (!apiKey) {
        return c.json({ error: "Clé fournisseur OpenRouter manquante." }, 500);
      }

      // Nettoyer le body : retirer tout champ `api_key` ou `Authorization` injecté par le client
      const {
        api_key: _ck,
        authorization: _ca,
        Authorization: _cA,
        ...safeBody
      } = body as Record<string, any>;

      const openRouterPayload = {
        ...safeBody,
        model: maiCloudBackend || body.model || modelRequested,
      };
      normalizeReasoningPayload(openRouterPayload);

      const openRouterRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          body: JSON.stringify(openRouterPayload),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mai.val.run",
            "X-Title": "mAI Public API (Gemini)",
          },
          method: "POST",
        }
      );

      if (openRouterRes.status === 200) {
        try {
          await sql`
            INSERT INTO weekly_usage (user_id, week_start, tokens_used)
            VALUES (${userId}::integer, ${weekStartStr}::date, 1)
            ON CONFLICT (user_id, week_start)
            DO UPDATE SET tokens_used = weekly_usage.tokens_used + 1
          `;
        } catch (_e) {}
      }

      return new Response(openRouterRes.body, {
        headers: {
          "Content-Type":
            openRouterRes.headers.get("Content-Type") || "application/json",
        },
        status: openRouterRes.status,
      });
    } catch (err: any) {
      console.error("[GeminiGenerate] Erreur inattendue:", err);
      return c.json(
        {
          details: err?.message || "Erreur interne.",
          error: "Failed to process Google Gemini request.",
        },
        500
      );
    }
  };

  app.post("/v1beta/models/*", handleGeminiGenerate);
  app.post("/v1/models/*:generateContent", handleGeminiGenerate);
  app.post("/v1/models/*:streamGenerateContent", handleGeminiGenerate);
}
