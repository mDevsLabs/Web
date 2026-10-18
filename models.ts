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
import {
  FALLBACK_IMAGE_MODELS,
  fetchLiveCometImageModels,
  formatOpenAiImageModel,
} from "./images.ts";
import {
  injectMaiIdentityPrompt,
  resolveMaiModelTraits,
} from "./mai-identity.ts";
import { maiModelsList } from "./maiModels.ts";
import {
  effectiveModel,
  getModelCatalog,
  isFreeModelId,
  isPublicAudioModel,
  isPublicChatModel,
  isPublicImageModel,
  ModelAccessError,
  requireChatModel,
  type SqlClient,
  validateModelRequest,
} from "./openrouter-models.ts";

function getOpenRouterApiKey(userCustomKey?: string | null): string {
  if (userCustomKey?.trim().startsWith("sk-or-")) {
    return userCustomKey.trim();
  }
  return Deno.env.get("OPENROUTER_API_KEY") || "";
}

// ─────────────────────────────────────────────
// Alias cloud mAI-2 -> backends OpenRouter (cachés aux utilisateurs).
// mAI-2      -> DeepSeek V4.1 Flash (1M ctx)
// mAI-2-Mini -> GLM 5.3 Flash (1M ctx)
// Disponibles pour tous les plans (Free, Plus, Pro, Max).
// ─────────────────────────────────────────────
const MAI_CLOUD_ALIASES: Record<string, string> = {
  "mai-2": "deepseek/deepseek-v4.1-flash",
  "mai-2-mini": "z-ai/glm-5.3-flash",
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

function buildMaiCloudPublicModels(nowSec: number) {
  const defs = maiModelsList.filter(
    (m) => resolveMaiCloudBackend(m.id) !== null
  );
  return defs.map((m) => {
    const traits = resolveMaiModelTraits(m.id);
    const efforts = traits?.reasoningEfforts ?? [];
    return {
      architecture: {
        input_modalities: [...(traits?.inputModalities ?? ["text"])],
        modality:
          (traits?.inputModalities ?? ["text"]).length > 1
            ? "text+image->text"
            : "text->text",
        output_modalities: ["text"],
      },
      created: Math.floor(new Date(m.releaseDate).getTime() / 1000) || nowSec,
      description: m.description || "",
      id: m.id,
      maxContext: m.contextWindow,
      maxOutput: traits?.maxOutputTokens ?? m.maxOutputTokens,
      name: m.name,
      object: "model",
      owned_by: "mDevsLabs",
      reasoning: {
        default_enabled: true,
        ...(traits?.defaultReasoningEffort
          ? { default_effort: traits.defaultReasoningEffort }
          : {}),
        mandatory: false,
        supported_efforts: [...efforts],
      },
      supported_parameters: [
        "temperature",
        "top_p",
        "max_tokens",
        "stream",
        "stop",
        "tools",
        "response_format",
        "reasoning",
        "include_reasoning",
      ],
    };
  });
}

function modelErrorResponse(c: any, error: unknown) {
  const e =
    error instanceof ModelAccessError
      ? error
      : new ModelAccessError(
          503,
          "model_catalog_unavailable",
          "Le catalogue est temporairement indisponible."
        );
  return c.json(
    {
      error: {
        code: e.code,
        message: e.message,
        param: "model",
        type: e.status === 403 ? "permission_error" : "invalid_request_error",
      },
    },
    e.status
  );
}

export function registerModelRoutes(
  app: Hono,
  database: () => SqlClient = getDb
) {
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

      const sql = database();

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
      const [maiBoost, audioBoost] = await Promise.all([
        getUserQuotaBoost(sql, resolvedUserId, "mai"),
        getUserQuotaBoost(sql, resolvedUserId, "audio"),
      ]);
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
      const tokensUsed = Number(
        body.tokensUsed || inputTokens + outputTokens || 0
      );
      const { weekStartStr } = getWeekData();

      const sql = database();
      const userRes =
        await sql`SELECT id, tier FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text LIMIT 1`;
      const tier = userRes.length > 0 ? userRes[0].tier : "Free";
      const resolvedUserId = userRes.length > 0 ? userRes[0].id : userId;
      const maiBoost = await getUserQuotaBoost(sql, resolvedUserId, "mai");
      const limit = getTierMaiTokenLimit(tier) + maiBoost;

      const usageResult = await sql`
        SELECT tokens_used FROM weekly_usage
        WHERE user_id = ${resolvedUserId}::integer AND week_start = ${weekStartStr}::date LIMIT 1
      `;
      const currentUsage = Number(usageResult[0]?.tokens_used || 0);
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

  const handleGetModels = async (c: any) => {
    try {
      const typeQuery = (c.req.query("type") || "").toLowerCase().trim();

      // Prise en charge de la recherche de modèles d'images (CometAPI)
      if (typeQuery === "image" || typeQuery === "images") {
        const userPlan = c.get("userPlan");
        const shouldFilterFreeOnly = !isPaidTier(userPlan);
        try {
          let models = await fetchLiveCometImageModels();
          if (shouldFilterFreeOnly) {
            models = models.filter((m) => {
              const idLower = (m.id || "").toLowerCase();
              return (
                idLower.includes("flux") ||
                idLower.includes("schnell") ||
                idLower.includes("free")
              );
            });
          }
          return c.json({ data: models, object: "list" });
        } catch {
          let fallback = FALLBACK_IMAGE_MODELS;
          if (shouldFilterFreeOnly) {
            fallback = fallback.filter((m) =>
              m.id.toLowerCase().includes("flux")
            );
          }
          return c.json({
            data: fallback.map(formatOpenAiImageModel),
            object: "list",
          });
        }
      }

      // Prise en charge de la recherche de modèles audio
      if (typeQuery === "audio" || typeQuery === "speech") {
        const catalog = await getModelCatalog(database());
        const paid = isPaidTier(c.get("userPlan"));
        const audioModels = catalog.models
          .filter(isPublicAudioModel)
          .filter((m) => paid || isFreeModelId(m.id))
          .map(effectiveModel);
        return c.json({ data: audioModels, object: "list" });
      }

      // Prise en charge de tous les types
      if (typeQuery === "all") {
        const catalog = await getModelCatalog(database());
        const paid = isPaidTier(c.get("userPlan"));
        const allModels = catalog.models
          .filter((m) => m.isActive && m.is_available)
          .filter((m) => paid || isFreeModelId(m.id))
          .map(effectiveModel);
        return c.json({ data: allModels, object: "list" });
      }

      // Par défaut : modèles de chat
      const catalog = await getModelCatalog(database());
      const paid = isPaidTier(c.get("userPlan"));
      const filtered = catalog.models
        .filter(isPublicChatModel)
        .filter((m) => paid || isFreeModelId(m.id))
        .map(effectiveModel);
      const lagunaIdx = filtered.findIndex(
        (m) => m.id === "poolside/laguna-xs-2.1:free"
      );
      if (lagunaIdx > 0) filtered.unshift(...filtered.splice(lagunaIdx, 1));
      const cloudModels = buildMaiCloudPublicModels(
        Math.floor(Date.now() / 1000)
      ).flatMap((m) => {
        // Si le modèle est déjà présent directement en BDD sous cet id, privilégier la BDD
        const directFromDb = catalog.byId.get(m.id);
        if (directFromDb && isPublicChatModel(directFromDb)) {
          return [effectiveModel(directFromDb)];
        }
        const backend = catalog.byId.get(resolveMaiCloudBackend(m.id)!);
        if (!backend || !isPublicChatModel(backend)) return [];
        const effective = effectiveModel(backend);
        return [
          {
            ...m,
            maxContext: effective.maxContext,
            maxOutput: effective.maxOutput,
            reasoning: effective.reasoning,
            supported_parameters: effective.supported_parameters,
          },
        ];
      });
      return c.json({ data: [...cloudModels, ...filtered], object: "list" });
    } catch (error) {
      return modelErrorResponse(c, error);
    }
  };
  app.get("/v1/models", handleGetModels);
  app.get("/models", handleGetModels);
  app.get("/v1beta/models", handleGetModels);

  const handleGetMaiModels = (c: any) => {
    const formatted = maiModelsList.map((m) => {
      if (resolveMaiCloudBackend(m.id) !== null) {
        return {
          capabilities: m.capabilities,
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
        owned_by: "mDevsLabs",
        parameters: m.parameters,
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
      const maiCloudBackend = resolveMaiCloudBackend(modelRequested);
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
              message:
                "Ce modèle mAI est destiné à une exécution locale via Ollama ou HuggingFace.",
              param: "model",
              type: "invalid_request_error",
            },
          },
          400
        );
      }
      let userId = c.get("userId");
      if (!userId) {
        const token = extractToken(c.req.raw);
        if (token) {
          try {
            userId = (await verifyToken(token)).sub as string;
          } catch {}
        }
      }
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const sql = database();
      const { weekStartStr } = getWeekData();
      const storedModel = await requireChatModel(
        sql,
        modelRequested,
        isPaidTier(userPlan),
        maiCloudBackend
      );
      validateModelRequest(body, storedModel);
      const [usageResult, maiBoost, keyRows] = await Promise.all([
        sql`SELECT tokens_used FROM weekly_usage
          WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date LIMIT 1`,
        getUserQuotaBoost(sql, userId, "mai"),
        sql`SELECT api_key FROM mprojects_api_keys
          WHERE user_id::text = ${userId}::text LIMIT 1`,
      ]);
      const currentUsage = Number(usageResult[0]?.tokens_used || 0);
      const limit = getTierMaiTokenLimit(userPlan) + maiBoost;
      if (currentUsage >= limit) {
        return c.json(
          { error: "Votre limite hebdomadaire est épuisée. Quota atteint." },
          429
        );
      }
      const apiKey = getOpenRouterApiKey(keyRows[0]?.api_key);

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

      // Prompt système obligatoire « You are mAI-2 … » pour les alias mAI-2.
      const identifiedBody = injectMaiIdentityPrompt(
        safeBody,
        modelRequested,
        "openai"
      );

      const openRouterRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          body: JSON.stringify(identifiedBody),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mai.val.run",
            "X-Title": "mAI Public API",
          },
          method: "POST",
          signal: c.req.raw.signal,
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
        } catch {}
      }

      return new Response(openRouterRes.body, {
        headers: {
          "Content-Type":
            openRouterRes.headers.get("Content-Type") || "application/json",
        },
        status: openRouterRes.status,
      });
    } catch (err: any) {
      if (err instanceof ModelAccessError) return modelErrorResponse(c, err);
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
      const maiCloudBackend = resolveMaiCloudBackend(modelRequested);

      const isFreePlan = !isPaidTier(userPlan);
      const isFreeModel = isFreeModelId(String(modelRequested || ""));
      const isMaiCloudAlias = maiCloudBackend !== null;

      // Bloquer avec 403 les requêtes pour les modèles payants avec une clé ou JWT free
      // Exception : alias cloud mAI-2 disponibles pour tous les plans.
      if (isFreePlan && !isFreeModel && !isMaiCloudAlias) {
        return c.json(
          {
            error: {
              code: "model_access_denied",
              message: `Le modèle '${
                modelRequested || "inconnu"
              }' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${userPlan}) autorise uniquement les modèles gratuits dont l'ID contient ':free' (ex: 'meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free').`,
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

      const sql = database();
      const { weekStartStr } = getWeekData();
      const storedModel = await requireChatModel(
        sql,
        modelRequested,
        isPaidTier(userPlan),
        maiCloudBackend
      );
      validateModelRequest(body, storedModel);
      const [usageResult, maiBoost, keyRows] = await Promise.all([
        sql`SELECT tokens_used FROM weekly_usage
          WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date LIMIT 1`,
        getUserQuotaBoost(sql, userId, "mai"),
        sql`SELECT api_key FROM mprojects_api_keys
          WHERE user_id::text = ${userId}::text LIMIT 1`,
      ]);
      const currentUsage = Number(usageResult[0]?.tokens_used || 0);
      const limit = getTierMaiTokenLimit(userPlan) + maiBoost;
      if (currentUsage >= limit) {
        return c.json(
          { error: "Votre limite hebdomadaire est épuisée. Quota atteint." },
          429
        );
      }
      const apiKey = getOpenRouterApiKey(keyRows[0]?.api_key);

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

      // Prompt système obligatoire « You are mAI-2 … » pour les alias mAI-2.
      const identifiedBody = injectMaiIdentityPrompt(
        safeBody,
        modelRequested,
        "anthropic"
      );

      const openRouterRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          body: JSON.stringify(identifiedBody),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mai.val.run",
            "X-Title": "mAI Public API (Anthropic)",
          },
          method: "POST",
          signal: c.req.raw.signal,
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
        } catch {}
      }

      return new Response(openRouterRes.body, {
        headers: {
          "Content-Type":
            openRouterRes.headers.get("Content-Type") || "application/json",
        },
        status: openRouterRes.status,
      });
    } catch (err: any) {
      if (err instanceof ModelAccessError) return modelErrorResponse(c, err);
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
      const maiCloudBackend = resolveMaiCloudBackend(modelRequested);

      const isFreePlan = !isPaidTier(userPlan);
      const isFreeModel = isFreeModelId(String(modelRequested || ""));
      const isMaiCloudAlias = maiCloudBackend !== null;

      // Bloquer avec 403 les requêtes pour les modèles payants avec une clé ou JWT free
      // Exception : alias cloud mAI-2 disponibles pour tous les plans.
      if (isFreePlan && !isFreeModel && !isMaiCloudAlias) {
        return c.json(
          {
            error: {
              code: 403,
              message: `Le modèle '${
                modelRequested || "inconnu"
              }' nécessite un forfait payant (Plus, Pro ou Max). Votre forfait actuel (${userPlan}) autorise uniquement les modèles gratuits contenant ':free' dans leur identifiant (ex: 'google/gemini-2.5-flash:free').`,
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

      const sql = database();
      const { weekStartStr } = getWeekData();
      const storedModel = await requireChatModel(
        sql,
        modelRequested,
        isPaidTier(userPlan),
        maiCloudBackend
      );
      validateModelRequest(body, storedModel);
      const [usageResult, maiBoost, keyRows] = await Promise.all([
        sql`SELECT tokens_used FROM weekly_usage
          WHERE user_id = ${userId}::integer AND week_start = ${weekStartStr}::date LIMIT 1`,
        getUserQuotaBoost(sql, userId, "mai"),
        sql`SELECT api_key FROM mprojects_api_keys
          WHERE user_id::text = ${userId}::text LIMIT 1`,
      ]);
      const currentUsage = Number(usageResult[0]?.tokens_used || 0);
      const limit = getTierMaiTokenLimit(userPlan) + maiBoost;
      if (currentUsage >= limit) {
        return c.json(
          { error: "Votre limite hebdomadaire est épuisée. Quota atteint." },
          429
        );
      }
      const apiKey = getOpenRouterApiKey(keyRows[0]?.api_key);

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

      const openRouterPayload = injectMaiIdentityPrompt(
        {
          ...safeBody,
          model: maiCloudBackend || body.model || modelRequested,
        },
        modelRequested,
        "gemini"
      );

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
          signal: c.req.raw.signal,
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
        } catch {}
      }

      return new Response(openRouterRes.body, {
        headers: {
          "Content-Type":
            openRouterRes.headers.get("Content-Type") || "application/json",
        },
        status: openRouterRes.status,
      });
    } catch (err: any) {
      if (err instanceof ModelAccessError) return modelErrorResponse(c, err);
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
