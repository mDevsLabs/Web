import type { Hono } from "npm:hono@4";
import {
  extractToken,
  getDb,
  getTierDailyImageLimit,
  getTierImageRequestCost,
  verifyToken,
} from "./config.ts";

export interface ImageModelItem {
  capabilities?: {
    image_to_image?: boolean;
    inpainting?: boolean;
    text_to_image?: boolean;
  };
  created: number;
  description: string;
  features: string[];
  id: string;
  name: string;
  object: "model";
  owned_by: string;
  parent?: string | null;
  permission?: Array<{
    allow_create_engine: boolean;
    allow_fine_tuning: boolean;
    allow_logprobs: boolean;
    allow_sampling: boolean;
    allow_search_indices: boolean;
    allow_view: boolean;
    created: number;
    group: string | null;
    id: string;
    is_blocking: boolean;
    object: "model_permission";
    organization: string;
  }>;
  root?: string;
}

export function getCometApiKey(): string {
  if (typeof Deno !== "undefined" && Deno.env) {
    return Deno.env.get("COMET_API_KEY") || "";
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env.COMET_API_KEY || "";
  }
  return "";
}

export function normalizeImageSrc(url?: string | null): string {
  if (!url || typeof url !== "string") {
    return "";
  }
  const clean = url.trim().replace(/^["']|["']$/g, "");
  if (!clean) {
    return "";
  }

  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("data:") ||
    clean.startsWith("blob:") ||
    clean.startsWith("/")
  ) {
    return clean;
  }

  let mime = "image/png";
  if (clean.startsWith("/9j/")) {
    mime = "image/jpeg";
  } else if (clean.startsWith("R0lGOD")) {
    mime = "image/gif";
  } else if (clean.startsWith("UklGR")) {
    mime = "image/webp";
  } else if (clean.startsWith("PHN2Zy") || clean.startsWith("PD94bWw")) {
    mime = "image/svg+xml";
  }

  return `data:${mime};base64,${clean}`;
}

/**
 * Cache mémoire pour les modèles CometAPI (TTL = 60 secondes)
 */
let cachedCometImageModels: ImageModelItem[] = [];
let lastCometFetchTime = 0;
const CACHE_TTL_MS = 60_000;

/**
 * Modèles de repli de haute qualité en cas de défaillance réseau temporaire de CometAPI
 */
const FALLBACK_IMAGE_MODELS: ImageModelItem[] = [
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1722470400,
    description:
      "Modèle de génération d'images ultra-rapide en 4 étapes par Black Forest Labs (Text-to-Image).",
    features: ["text-to-image"],
    id: "black-forest-labs/flux-1-schnell",
    name: "FLUX.1 Schnell",
    object: "model",
    owned_by: "black-forest-labs",
  },
  {
    capabilities: { image_to_image: true, inpainting: true, text_to_image: true },
    created: 1722470400,
    description:
      "Modèle phare de haute précision pour la synthèse d'images photoréalistes et artistiques (Text-to-Image / Image-to-Image).",
    features: ["text-to-image", "image-to-image"],
    id: "black-forest-labs/flux-1-dev",
    name: "FLUX.1 Dev",
    object: "model",
    owned_by: "black-forest-labs",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1727827200,
    description:
      "Le sommet de la qualité visuelle, cohérence typographique et détails avancés par Black Forest Labs.",
    features: ["text-to-image"],
    id: "black-forest-labs/flux-1.1-pro",
    name: "FLUX 1.1 Pro",
    object: "model",
    owned_by: "black-forest-labs",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1730419200,
    description:
      "Version Ultra haute résolution (jusqu'à 4K) avec photoréalisme extrême et rendu de peau ultra-détaillé par Black Forest Labs.",
    features: ["text-to-image"],
    id: "black-forest-labs/flux-1.1-pro-ultra",
    name: "FLUX 1.1 Pro Ultra",
    object: "model",
    owned_by: "black-forest-labs",
  },
  {
    capabilities: { image_to_image: true, inpainting: true, text_to_image: true },
    created: 1729641600,
    description:
      "Modèle de pointe de 8 milliards de paramètres de Stability AI pour une variété stylistique maximale et une typographie précise.",
    features: ["text-to-image", "image-to-image"],
    id: "stabilityai/stable-diffusion-3.5-large",
    name: "Stable Diffusion 3.5 Large",
    object: "model",
    owned_by: "stabilityai",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1729641600,
    description:
      "Version accélérée en 4 étapes de Stable Diffusion 3.5 Large par Stability AI.",
    features: ["text-to-image"],
    id: "stabilityai/stable-diffusion-3.5-large-turbo",
    name: "Stable Diffusion 3.5 Large Turbo",
    object: "model",
    owned_by: "stabilityai",
  },
  {
    capabilities: { image_to_image: true, inpainting: true, text_to_image: true },
    created: 1690848000,
    description:
      "Modèle de base SDXL 1.0 haute résolution de Stability AI pour la création artistique et le rendu réaliste.",
    features: ["text-to-image", "image-to-image"],
    id: "stabilityai/sdxl",
    name: "Stable Diffusion XL 1.0",
    object: "model",
    owned_by: "stabilityai",
  },
  {
    capabilities: { image_to_image: true, inpainting: true, text_to_image: true },
    created: 1718064000,
    description:
      "Génération stylisée haut de gamme avec esthétique cinématique et compréhension sémantique de pointe.",
    features: ["text-to-image", "image-to-image"],
    id: "midjourney/v6",
    name: "Midjourney v6",
    object: "model",
    owned_by: "midjourney",
  },
  {
    capabilities: { image_to_image: true, inpainting: true, text_to_image: true },
    created: 1722384000,
    description:
      "Dernière itération du moteur Midjourney v6.1 avec cohérence accrue des mains, textures et détails fins.",
    features: ["text-to-image", "image-to-image"],
    id: "midjourney/v6.1",
    name: "Midjourney v6.1",
    object: "model",
    owned_by: "midjourney",
  },
  {
    capabilities: { image_to_image: true, inpainting: false, text_to_image: true },
    created: 1730419200,
    description:
      "Génération vectorielle et matricielle spécialisée dans les logos, icônes, illustrations et design graphique.",
    features: ["text-to-image", "image-to-image"],
    id: "recraft-ai/recraft-v3",
    name: "Recraft V3",
    object: "model",
    owned_by: "recraft-ai",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1724284800,
    description:
      "Modèle phare de rendu de texte dans l'image et composition graphique par Ideogram AI.",
    features: ["text-to-image"],
    id: "ideogram-ai/ideogram-v2",
    name: "Ideogram V2",
    object: "model",
    owned_by: "ideogram-ai",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1724284800,
    description:
      "Version ultra-rapide d'Ideogram V2 optimisée pour les flux de production en temps réel.",
    features: ["text-to-image"],
    id: "ideogram-ai/ideogram-v2-turbo",
    name: "Ideogram V2 Turbo",
    object: "model",
    owned_by: "ideogram-ai",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1698796800,
    description:
      "Modèle DALL-E 3 d'OpenAI pour la synthèse d'images haute fidélité avec reformulation automatique des prompts.",
    features: ["text-to-image"],
    id: "openai/dall-e-3",
    name: "DALL-E 3",
    object: "model",
    owned_by: "openai",
  },
  {
    capabilities: { image_to_image: true, inpainting: true, text_to_image: true },
    created: 1667260800,
    description:
      "Modèle classique DALL-E 2 d'OpenAI pour la génération et l'édition rapide d'images.",
    features: ["text-to-image", "image-to-image"],
    id: "openai/dall-e-2",
    name: "DALL-E 2",
    object: "model",
    owned_by: "openai",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1723680000,
    description:
      "Modèle de synthèse photoréaliste et typographique de Google DeepMind Imagen 3.",
    features: ["text-to-image"],
    id: "google/imagen-3",
    name: "Google Imagen 3",
    object: "model",
    owned_by: "google",
  },
  {
    capabilities: { image_to_image: false, inpainting: false, text_to_image: true },
    created: 1730000000,
    description:
      "Modèle ultra-rapide de génération photoréaliste par Luma AI.",
    features: ["text-to-image"],
    id: "luma/photon",
    name: "Luma Photon",
    object: "model",
    owned_by: "luma",
  },
];

/**
 * Mapper les alias de modèles vers les identifiants CometAPI standard
 */
function resolveImageModel(requestedModel: string): string {
  if (!requestedModel) return "black-forest-labs/flux-1-schnell";
  const lower = requestedModel.toLowerCase().trim();

  // DALL-E
  if (lower === "dall-e-3" || lower === "dalle-3" || lower === "dall-e") {
    return "openai/dall-e-3";
  }
  if (lower === "dall-e-2" || lower === "dalle-2") {
    return "openai/dall-e-2";
  }

  // Google Imagen
  if (lower.includes("imagen-3") || lower === "imagen") {
    return "google/imagen-3";
  }

  // Midjourney
  if (lower === "midjourney" || lower === "mj" || lower === "midjourney-v6" || lower === "midjourney/v6") {
    return "midjourney/v6";
  }
  if (lower === "midjourney-v6.1" || lower === "mj-v6.1" || lower === "midjourney/v6.1") {
    return "midjourney/v6.1";
  }

  // Flux
  if (lower === "flux" || lower === "flux-schnell" || lower === "flux-1-schnell" || lower === "black-forest-labs/flux-1-schnell") {
    return "black-forest-labs/flux-1-schnell";
  }
  if (lower === "flux-dev" || lower === "flux-1-dev" || lower === "black-forest-labs/flux-1-dev") {
    return "black-forest-labs/flux-1-dev";
  }
  if (lower === "flux-pro" || lower === "flux-1.1-pro" || lower === "black-forest-labs/flux-1.1-pro") {
    return "black-forest-labs/flux-1.1-pro";
  }
  if (lower === "flux-ultra" || lower === "flux-1.1-pro-ultra" || lower === "black-forest-labs/flux-1.1-pro-ultra") {
    return "black-forest-labs/flux-1.1-pro-ultra";
  }

  // Stable Diffusion
  if (lower === "sd3.5" || lower === "sd-3.5" || lower === "sd-3.5-large" || lower === "stable-diffusion-3.5-large") {
    return "stabilityai/stable-diffusion-3.5-large";
  }
  if (lower === "sd3.5-turbo" || lower === "stable-diffusion-3.5-large-turbo") {
    return "stabilityai/stable-diffusion-3.5-large-turbo";
  }
  if (lower === "sdxl" || lower === "stable-diffusion-xl") {
    return "stabilityai/sdxl";
  }

  // Recraft
  if (lower === "recraft" || lower === "recraft-v3" || lower === "recraft-ai/recraft-v3") {
    return "recraft-ai/recraft-v3";
  }

  // Ideogram
  if (lower === "ideogram" || lower === "ideogram-v2" || lower === "ideogram-ai/ideogram-v2") {
    return "ideogram-ai/ideogram-v2";
  }
  if (lower === "ideogram-turbo" || lower === "ideogram-v2-turbo" || lower === "ideogram-ai/ideogram-v2-turbo") {
    return "ideogram-ai/ideogram-v2-turbo";
  }

  // Luma Photon
  if (lower === "photon" || lower === "luma-photon" || lower === "luma/photon") {
    return "luma/photon";
  }

  // Retourner le modèle tel quel si déjà formaté ou spécifique à CometAPI
  return requestedModel;
}

/**
 * Formatage d'un modèle d'image selon le schéma OpenAI Model Specification
 */
function formatOpenAiImageModel(m: any): ImageModelItem {
  const modelId = m.id || "image-model";
  const org = m.owned_by || modelId.split("/")[0] || "cometapi";
  const created = Number(m.created) || Math.floor(Date.now() / 1000) - 86_400 * 30;
  const features =
    m.features ||
    m.supported_features ||
    (modelId.toLowerCase().includes("diffusion") || modelId.toLowerCase().includes("midjourney")
      ? ["text-to-image", "image-to-image"]
      : ["text-to-image"]);

  return {
    capabilities: {
      image_to_image: features.includes("image-to-image"),
      inpainting: features.includes("inpainting") || features.includes("image-to-image"),
      text_to_image: true,
    },
    created,
    description: m.description || `Modèle de génération d'images haute fidélité ${m.name || modelId}.`,
    features,
    id: modelId,
    name: m.name || modelId,
    object: "model",
    owned_by: org,
    parent: null,
    permission: [
      {
        allow_create_engine: false,
        allow_fine_tuning: false,
        allow_logprobs: true,
        allow_sampling: true,
        allow_search_indices: false,
        allow_view: true,
        created,
        group: null,
        id: `modelperm-${modelId.replace(/[^a-zA-Z0-9]/g, "-")}`,
        is_blocking: false,
        object: "model_permission",
        organization: "*",
      },
    ],
    root: modelId,
  };
}

/**
 * Récupération dynamique et filtrage en temps réel des modèles d'images depuis CometAPI
 */
async function fetchLiveCometImageModels(): Promise<ImageModelItem[]> {
  const now = Date.now();
  if (cachedCometImageModels.length > 0 && now - lastCometFetchTime < CACHE_TTL_MS) {
    return cachedCometImageModels;
  }

  const cometApiKey = getCometApiKey();
  if (!cometApiKey) {
    return FALLBACK_IMAGE_MODELS;
  }

  try {
    const res = await fetch("https://api.cometapi.com/v1/models", {
      headers: {
        Authorization: `Bearer ${cometApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[CometAPI] /v1/models réponse non-OK (${res.status})`);
      return cachedCometImageModels.length > 0 ? cachedCometImageModels : FALLBACK_IMAGE_MODELS;
    }

    const json = await res.json();
    const rawModels: any[] = json.data || json.models || [];

    // Filtrage dynamique des modèles d'image
    const imageModels = rawModels.filter((m: any) => {
      if (!m || !m.id) return false;
      const mType = String(
        m.model_type ||
        m.type ||
        m.architecture?.modality ||
        m.object ||
        ""
      ).toLowerCase();
      const outputModalities = (m.architecture?.output_modalities || []).map((o: string) =>
        String(o).toLowerCase()
      );
      const features = (m.features || m.supported_features || []).map((f: string) =>
        String(f).toLowerCase()
      );
      const idLower = String(m.id).toLowerCase();

      const isImageModality =
        mType.includes("image") ||
        outputModalities.includes("image") ||
        mType.endsWith("->image") ||
        mType.includes("text->image");

      const hasImageFeature =
        features.includes("text-to-image") ||
        features.includes("image-to-image") ||
        features.includes("inpainting") ||
        features.includes("image");

      const matchesImageKeyword =
        idLower.includes("flux") ||
        idLower.includes("diffusion") ||
        idLower.includes("dall-e") ||
        idLower.includes("midjourney") ||
        idLower.includes("recraft") ||
        idLower.includes("ideogram") ||
        idLower.includes("imagen") ||
        idLower.includes("photon") ||
        idLower.includes("kling") ||
        idLower.includes("kolors") ||
        idLower.includes("sdxl") ||
        idLower.includes("stable-diffusion") ||
        idLower.startsWith("sd-") ||
        idLower.includes("/sd");

      return isImageModality || hasImageFeature || matchesImageKeyword;
    });

    if (imageModels.length > 0) {
      const formatted = imageModels.map(formatOpenAiImageModel);
      cachedCometImageModels = formatted;
      lastCometFetchTime = now;
      return formatted;
    }

    return cachedCometImageModels.length > 0 ? cachedCometImageModels : FALLBACK_IMAGE_MODELS;
  } catch (err) {
    console.error("[CometAPI] Erreur de récupération des modèles:", err);
    return cachedCometImageModels.length > 0 ? cachedCometImageModels : FALLBACK_IMAGE_MODELS;
  }
}

export function registerImageRoutes(app: Hono) {
  // ─────────────────────────────────────────────
  // GET /v1/models/images, /models/images & /v1/images/models (OpenAI Compatible)
  // ─────────────────────────────────────────────
  const handleGetImageModels = async (c: any) => {
    const userPlan = c.get("userPlan");
    const planStr = String(userPlan || "Free")
      .toLowerCase()
      .trim();
    const isPaidPlan = ["plus", "pro", "max"].includes(planStr);
    const shouldFilterFreeOnly = !isPaidPlan;

    try {
      let models = await fetchLiveCometImageModels();

      // Si Free : filtrer pour les modèles accessibles gratuitement
      if (shouldFilterFreeOnly) {
        models = models.filter((m) => {
          const idLower = (m.id || "").toLowerCase();
          return idLower.includes("flux") || idLower.includes("schnell") || idLower.includes("free");
        });
      }

      return c.json({ data: models, object: "list" });
    } catch (_err) {
      let fallback = FALLBACK_IMAGE_MODELS;
      if (shouldFilterFreeOnly) {
        fallback = fallback.filter((m) => m.id.toLowerCase().includes("flux"));
      }
      return c.json({ data: fallback.map(formatOpenAiImageModel), object: "list" });
    }
  };

  app.get("/v1/models/images", handleGetImageModels);
  app.get("/models/images", handleGetImageModels);
  app.get("/v1/images/models", handleGetImageModels);
  app.get("/images/models", handleGetImageModels);

  // ─────────────────────────────────────────────
  // GET /v1/models/images/:id & /models/images/:id (OpenAI Model Detail)
  // ─────────────────────────────────────────────
  const handleGetSingleImageModel = async (c: any) => {
    const rawId = c.req.param("id") || "";
    const resolvedId = resolveImageModel(rawId);

    const liveModels = await fetchLiveCometImageModels();
    const found =
      liveModels.find(
        (m) =>
          m.id.toLowerCase() === rawId.toLowerCase() ||
          m.id.toLowerCase() === resolvedId.toLowerCase() ||
          m.name.toLowerCase() === rawId.toLowerCase()
      ) ||
      FALLBACK_IMAGE_MODELS.find(
        (m) =>
          m.id.toLowerCase() === rawId.toLowerCase() ||
          m.id.toLowerCase() === resolvedId.toLowerCase() ||
          m.name.toLowerCase() === rawId.toLowerCase()
      ) || {
        created: Math.floor(Date.now() / 1000),
        description: `Modèle d'image ${rawId}.`,
        features: ["text-to-image"],
        id: resolvedId,
        name: rawId,
        object: "model" as const,
        owned_by: resolvedId.split("/")[0] || "cometapi",
      };

    return c.json(formatOpenAiImageModel(found));
  };

  app.get("/v1/models/images/:id", handleGetSingleImageModel);
  app.get("/models/images/:id", handleGetSingleImageModel);

  // ─────────────────────────────────────────────
  // GET /v1/images/usage
  // ─────────────────────────────────────────────
  app.get("/v1/images/usage", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      let userId = c.get("userId");
      let userPlan = c.get("userPlan") || "Free";

      if (token) {
        try {
          const payload = await verifyToken(token);
          userId = (payload.sub as string) || userId;
          userPlan = (payload.tier as string) || userPlan;
        } catch {
          // Token non JWT ignoré
        }
      }

      const sql = getDb();

      // Résolution du user_id réel via mprojects_api_keys si clé API transmise
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
            userPlan = keyRows[0].tier || userPlan;
          }
        } catch {
          // Erreur DB ignorée
        }
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const [uRows, countRows] = await Promise.all([
        sql`SELECT tier FROM users WHERE id::text = ${userId}::text OR username = ${userId}::text OR email = ${userId}::text LIMIT 1`,
        sql`
          SELECT COALESCE(SUM(images_generated::numeric), 0) as images_generated 
          FROM mprojects_daily_image_usage 
          WHERE (
            user_id = ${userId}::text 
            OR user_id IN (SELECT id::text FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
            OR user_id IN (SELECT email FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
            OR user_id IN (SELECT username FROM users WHERE id::text = ${userId}::text OR email = ${userId}::text OR username = ${userId}::text)
          ) AND usage_date = CURRENT_DATE 
          LIMIT 1
        `.catch(() => []),
      ]);

      const effectiveTier = uRows[0]?.tier || userPlan || "Free";
      const usedToday = Number(countRows[0]?.images_generated || 0);
      const dailyLimit = getTierDailyImageLimit(effectiveTier);

      const now = new Date();
      const tomorrowMidnight = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0
        )
      );

      return c.json({
        dailyLimit,
        plan: effectiveTier,
        resetAt: tomorrowMidnight.toISOString(),
        usedToday,
        userId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      return c.json(
        {
          details: msg,
          error: "Erreur lors de la récupération de l'usage image.",
        },
        500
      );
    }
  });

  // ─────────────────────────────────────────────
  // GET /v1/images/history
  // ─────────────────────────────────────────────
  app.get("/v1/images/history", async (c) => {
    try {
      const token = extractToken(c.req.raw);
      let userId = c.get("userId");

      if (token) {
        try {
          const payload = await verifyToken(token);
          userId = payload.sub as string;
        } catch {
          // Token invalide ignoré
        }
      }

      if (!userId) {
        return c.json({ error: "Non authentifié." }, 401);
      }

      const sql = getDb();
      const history = await sql`
        SELECT id, model, prompt, negative_prompt, width, height, image_url, status, created_at
        FROM mprojects_image_generations
        WHERE user_id = ${userId}::text
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const formattedHistory = history.map((item: any) => ({
        ...item,
        image_url: normalizeImageSrc(item.image_url),
      }));

      return c.json({ data: formattedHistory, success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      return c.json(
        { details: msg, error: "Erreur historique images." },
        500
      );
    }
  });

  // ─────────────────────────────────────────────
  // POST /v1/images/generations, /images/generations, /v1/images/edits, /v1/models/*:generateImages (OpenAI & Google SDK)
  // ─────────────────────────────────────────────
  const handleImageGeneration = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      const authHeader = c.req.header("Authorization");
      const headerApiKey =
        c.req.header("x-api-key") ||
        c.req.header("X-API-Key") ||
        c.req.header("x-goog-api-key") ||
        c.req.header("X-Goog-Api-Key");
      const apiKey = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : headerApiKey || null;

      let userId = c.get("userId");
      let userPlan = c.get("userPlan") || "Free";

      if (token) {
        try {
          const payload = await verifyToken(token);
          userId = payload.sub as string;
          userPlan = (payload.tier as string) || userPlan;
        } catch {
          // Token non JWT ignoré
        }
      }

      if (!userId) {
        return c.json(
          {
            error: {
              code: "invalid_api_key",
              message: "Non authentifié. Clé API ou token requis.",
              param: null,
              type: "authentication_error",
            },
          },
          401
        );
      }

      const body = await c.req.json().catch(() => ({}));
      const reqPath = c.req.path || "";
      const isGoogleFormat =
        reqPath.includes(":generateImages") ||
        reqPath.includes(":predict") ||
        Boolean(body.instances || body.numberOfImages || body.aspectRatio);

      // Support des paramètres OpenAI & Google GenAI
      const rawPrompt =
        body.prompt ||
        body.instances?.[0]?.prompt ||
        body.parameters?.prompt ||
        "";
      const prompt = typeof rawPrompt === "string" ? rawPrompt.trim() : "";

      // Extraction et résolution dynamique du modèle demandé
      const pathModel = reqPath
        .replace(/^\/(v1beta|v1)\/models\//, "")
        .replace(/:(generateImages|predict).*$/, "");
      const requestedModel =
        body.model || pathModel || "black-forest-labs/flux-1-schnell";

      const model = resolveImageModel(requestedModel);

      // Résolution des dimensions (support aspectRatio Google et size OpenAI)
      let width = 1024;
      let height = 1024;

      if (body.aspectRatio) {
        const ar = String(body.aspectRatio).trim();
        if (ar === "16:9") {
          width = 1280;
          height = 720;
        } else if (ar === "9:16") {
          width = 720;
          height = 1280;
        } else if (ar === "4:3") {
          width = 1024;
          height = 768;
        } else if (ar === "3:4") {
          width = 768;
          height = 1024;
        } else if (ar === "21:9") {
          width = 1536;
          height = 640;
        }
      } else if (body.size) {
        const parts = String(body.size).split("x");
        if (parts.length === 2) {
          width = Number.parseInt(parts[0], 10) || 1024;
          height = Number.parseInt(parts[1], 10) || 1024;
        }
      } else {
        if (body.width) width = Number(body.width);
        if (body.height) height = Number(body.height);
      }

      const negativePrompt = body.negative_prompt || "";
      const n = Math.max(1, Math.min(Number(body.n || body.numberOfImages || 1), 4));
      const responseFormat = body.response_format || "url";
      const quality = body.quality || "standard";
      const style = body.style || "vivid";

      if (!prompt) {
        return c.json(
          {
            error: {
              code: "missing_prompt",
              message: "Le paramètre 'prompt' est obligatoire pour la génération d'images.",
              param: "prompt",
              type: "invalid_request_error",
            },
          },
          400
        );
      }

      const sql = getDb();

      // Vérifier le forfait utilisateur réel dans la table users
      const uRows = await sql`
        SELECT tier FROM users 
        WHERE id::text = ${userId}::text OR username = ${userId}::text 
        LIMIT 1
      `;
      const effectiveTier = uRows[0]?.tier || userPlan || "Free";
      const planStr = effectiveTier.toLowerCase().trim();
      const isPaidPlan = ["plus", "pro", "max"].includes(planStr);

      // Bloquer les utilisateurs du forfait Free pour la génération d'images via clé API
      if (!isPaidPlan) {
        return c.json(
          {
            error: {
              code: "image_generation_tier_restricted",
              message: `La génération d'images via l'API est réservée aux abonnements payants (Plus, Pro, Max). Les clés API issues d'un compte Free ne sont pas autorisées à effectuer de requêtes de génération d'images.`,
              param: null,
              type: "permission_error",
            },
          },
          403
        );
      }

      // Vérification du quota journalier (Plus: 5/j, Pro: 10/j, Max: 20/j)
      const dailyLimit = getTierDailyImageLimit(effectiveTier);

      const usageRows = await sql`
        SELECT images_generated 
        FROM mprojects_daily_image_usage 
        WHERE user_id = ${userId}::text AND usage_date = CURRENT_DATE 
        LIMIT 1
      `;
      const currentDailyUsage = Number(usageRows[0]?.images_generated || 0);

      if (currentDailyUsage >= dailyLimit) {
        return c.json(
          {
            error: {
              code: "daily_image_quota_exceeded",
              limit: dailyLimit,
              message: `Votre quota journalier de génération d'images est épuisé (${currentDailyUsage}/${dailyLimit} par jour pour le forfait ${effectiveTier}). Réinitialisation automatique à minuit UTC.`,
              type: "quota_error",
              used: currentDailyUsage,
            },
          },
          429
        );
      }

      // Appel de Comet API
      const cometApiKey = getCometApiKey();
      let generatedImageUrl = "";
      let cometResultData: Array<{ b64_json?: string; revised_prompt?: string; url?: string }> = [];

      if (cometApiKey) {
        const imagePayload: Record<string, unknown> = {
          model,
          n,
          prompt,
          quality,
          response_format: responseFormat,
          size: `${width}x${height}`,
          style,
        };

        if (negativePrompt) {
          imagePayload.negative_prompt = negativePrompt;
        }
        if (body.seed !== undefined) {
          imagePayload.seed = body.seed;
        }
        if (body.image || body.image_url) {
          imagePayload.image = body.image || body.image_url;
        }
        if (body.mask) {
          imagePayload.mask = body.mask;
        }

        const isEditRequest = reqPath.includes("/edits") || Boolean(body.image || body.image_url);
        const endpointUrl = isEditRequest
          ? "https://api.cometapi.com/v1/images/edits"
          : "https://api.cometapi.com/v1/images/generations";

        const cometRes = await fetch(endpointUrl, {
          body: JSON.stringify(imagePayload),
          headers: {
            Authorization: `Bearer ${cometApiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        if (!cometRes.ok) {
          const errText = await cometRes.text().catch(() => "");
          console.error("[CometAPI] Erreur génération:", cometRes.status, errText);
          return c.json(
            {
              error: {
                code: "upstream_comet_error",
                details: errText,
                message: "Erreur retournée par le fournisseur Comet API.",
                type: "api_error",
              },
            },
            cometRes.status
          );
        }

        const cometJson = await cometRes.json();
        cometResultData = (cometJson.data || []).map((img: any) => {
          const rawUrl = img.url || "";
          const b64 = img.b64_json || "";
          const resolved = normalizeImageSrc(rawUrl || b64);
          return {
            b64_json: b64 || (responseFormat === "b64_json" && resolved.startsWith("data:") ? resolved.split(",")[1] : undefined),
            revised_prompt: img.revised_prompt || prompt,
            url: resolved || rawUrl,
          };
        });

        if (cometResultData.length > 0) {
          generatedImageUrl = cometResultData[0].url || "";
        }
      } else {
        // Mode simulation / fallback si la clé Comet n'est pas configurée dans l'environnement
        generatedImageUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 20))}/${width}/${height}`;
        cometResultData = [
          {
            revised_prompt: prompt,
            url: generatedImageUrl,
          },
        ];
      }

      // Incrémentation du quota journalier
      await sql`
        INSERT INTO mprojects_daily_image_usage (user_id, usage_date, images_generated, updated_at)
        VALUES (${userId}::text, CURRENT_DATE, 1, NOW())
        ON CONFLICT (user_id, usage_date)
        DO UPDATE SET 
          images_generated = mprojects_daily_image_usage.images_generated + 1,
          updated_at = NOW()
      `;

      // Enregistrement dans l'historique
      await sql`
        INSERT INTO mprojects_image_generations (
          user_id, api_key, model, prompt, negative_prompt, width, height, image_url, status
        ) VALUES (
          ${userId}::text,
          ${apiKey || null},
          ${model}::text,
          ${prompt}::text,
          ${negativePrompt || null},
          ${width}::integer,
          ${height}::integer,
          ${generatedImageUrl}::text,
          'completed'
        )
      `;

      // Incrémentation du compteur de requêtes de la clé API selon le forfait (Free: 100, Plus: 50, Pro: 25, Max: 10)
      const requestCost = getTierImageRequestCost(effectiveTier);
      if (apiKey) {
        await sql`
          UPDATE mprojects_api_keys
          SET request_count = request_count + ${requestCost}, last_used_at = NOW()
          WHERE api_key = ${apiKey}
        `;
      }

      // Enregistrement du log de requête
      try {
        await sql`
          INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms, created_at)
          VALUES (${apiKey || "anonymous"}::text, ${reqPath || "/v1/images/generations"}::text, 'POST', 200, 1500, NOW())
        `;
      } catch {
        // Logging non bloquant
      }

      // Formatage de la réponse selon le SDK appelant (Google GenAI vs OpenAI / Anthropic)
      if (isGoogleFormat) {
        return c.json({
          generatedImages: cometResultData.map((img) => ({
            image: {
              imageBytes: img.b64_json || "",
              mimeType: "image/png",
              uri: img.url || generatedImageUrl,
            },
          })),
        });
      }

      // Format OpenAI Standard par défaut
      return c.json({
        created: Math.floor(Date.now() / 1000),
        data: cometResultData,
        usage: {
          daily_limit: dailyLimit,
          daily_used: currentDailyUsage + 1,
          plan: effectiveTier,
          request_cost: requestCost,
          requests_counted: requestCost,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[ImagesAPI] Erreur serveur:", err);
      return c.json(
        {
          error: {
            code: "internal_server_error",
            details: msg,
            message: "Erreur serveur lors de la génération d'image.",
            type: "server_error",
          },
        },
        500
      );
    }
  };

  // Routes OpenAI & Anthropic SDK
  app.post("/v1/images/generations", handleImageGeneration);
  app.post("/images/generations", handleImageGeneration);
  app.post("/v1/images", handleImageGeneration);
  app.post("/images", handleImageGeneration);
  app.post("/v1/images/edits", handleImageGeneration);
  app.post("/images/edits", handleImageGeneration);
  app.post("/v1/images/variations", handleImageGeneration);
  app.post("/images/variations", handleImageGeneration);

  // Routes Google GenAI / Gemini / Vertex SDK
  app.post("/v1beta/models/*:generateImages", handleImageGeneration);
  app.post("/v1/models/*:generateImages", handleImageGeneration);
  app.post("/v1beta/models/*:predict", handleImageGeneration);
  app.post("/v1/models/*:predict", handleImageGeneration);
}
