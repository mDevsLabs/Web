import type { Hono } from "npm:hono@4";
import {
  extractTierFromApiKey,
  getDb,
  getEnv,
  getTierRequestLimit,
  getUserQuotaBoost,
  getWeekData,
  verifyToken,
} from "./config.ts";

export function registerMiddleware(app: Hono) {
  // Middleware global pour Auth, Rate limiting & Logging sur toutes les routes d'API
  app.use("*", async (c, next) => {
    // Preflight CORS : laisser passer sans auth (géré par le middleware CORS de main.ts)
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }

    const path = c.req.path;

    // Détection des routes d'API
    const isApiRoute =
      path.startsWith("/v1/") ||
      path.startsWith("/v1beta/") ||
      path === "/v1/models" ||
      path === "/models" ||
      path.startsWith("/models/") ||
      path === "/v1beta/models" ||
      path === "/chat/completions" ||
      path.startsWith("/chat/") ||
      path === "/messages" ||
      path.startsWith("/messages/") ||
      path === "/speech" ||
      path.startsWith("/speech/") ||
      path === "/images" ||
      path.startsWith("/images/") ||
      path === "/images/generations" ||
      path === "/mj" ||
      path.startsWith("/mj/") ||
      path.startsWith("/v1/mj/") ||
      path === "/audio/speech" ||
      path.startsWith("/audio/") ||
      path === "/usage/speech" ||
      path === "/v1/usage/speech" ||
      path === "/usage" ||
      path === "/v1/usage" ||
      path === "/log-usage" ||
      path === "/v1/log-usage" ||
      path === "/v1/status" ||
      path === "/status";

    if (!isApiRoute) {
      await next();
      return;
    }

    const isPublicRoute =
      path === "/" ||
      path === "/api" ||
      path === "/api/" ||
      path === "/v1" ||
      path === "/v1/" ||
      path === "/vibe" ||
      path === "/vibe/" ||
      path === "/api/vibe" ||
      path === "/api/vibe/" ||
      path === "/v1/login" ||
      path === "/v1/register" ||
      path === "/v1/verify-login" ||
      path === "/v1/verify-register" ||
      path === "/v1/resend-code" ||
      path.startsWith("/v1/feed") ||
      path.startsWith("/api/vibe/feed") ||
      path.startsWith("/vibe/feed") ||
      path === "/feed" ||
      path.startsWith("/v1/posts") ||
      path.startsWith("/api/vibe/posts") ||
      path.startsWith("/v1/trends") ||
      path.startsWith("/api/vibe/trends") ||
      path.startsWith("/v1/profiles") ||
      path.startsWith("/api/vibe/profiles") ||
      path.startsWith("/v1/search") ||
      path.startsWith("/api/vibe/search") ||
      path.startsWith("/vibe/search") ||
      path.startsWith("/search") ||
      path === "/v1/models" ||
      path === "/models" ||
      path === "/v1beta/models" ||
      path === "/v1/models/images" ||
      path === "/models/images" ||
      path === "/v1/images/models" ||
      path === "/images/models" ||
      path.startsWith("/v1/models/images/") ||
      path.startsWith("/models/images/") ||
      path === "/v1/models/speech" ||
      path === "/models/speech" ||
      path === "/v1/speech/models" ||
      path === "/speech/models" ||
      path === "/v1/speech/voices" ||
      path === "/speech/voices" ||
      path === "/v1/audio/models" ||
      path === "/v1/audio/voices" ||
      path === "/v1/models/mai" ||
      path === "/v1/mai/models" ||
      path === "/models/mai" ||
      path === "/mai/models" ||
      path === "/v1/status" ||
      path === "/status" ||
      path === "/v1/web/search" ||
      path.startsWith("/v1/web/");

    const authHeader =
      c.req.header("Authorization") || c.req.header("authorization");
    const headerApiKey =
      c.req.header("x-api-key") ||
      c.req.header("X-API-Key") ||
      c.req.header("x-goog-api-key") ||
      c.req.header("X-Goog-Api-Key");
    const queryApiKey =
      c.req.query("api_key") ||
      c.req.query("key") ||
      // JWT de session en query : requis pour le flux SSE (EventSource ne
      // peut pas définir d'en-têtes) — cf. realtime.ts /v1/realtime/stream
      c.req.query("token");

    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    let rawApiKey =
      bearerToken ||
      authHeader ||
      headerApiKey ||
      queryApiKey ||
      null;

    if (rawApiKey) {
      rawApiKey = rawApiKey.trim();
      if (
        rawApiKey === "" ||
        rawApiKey === "null" ||
        rawApiKey === "undefined" ||
        rawApiKey === "Bearer"
      ) {
        rawApiKey = null;
      }
    }

    const apiKey = rawApiKey;
    const reqUserId = c.req.header("x-user-id") || c.req.header("X-User-Id");
    const startTime = Date.now();

    const systemMaiApiKey = getEnv("MAI_API_KEY")?.trim() || null;

    let userPlan = "Free";
    let currentUserId: string | null = null;
    let matchedApiKey: string | null = null;
    let isRegisteredApiKey = false;
    let isJwtAuth = false;
    let isSystemAuth = false;

    function timingSafeEqual(a: string, b: string): boolean {
      const maxLength = Math.max(a.length, b.length, 1);
      let diff = a.length ^ b.length;
      for (let i = 0; i < maxLength; i++) {
        const aChar = a.length > 0 ? a.charCodeAt(i % a.length) : 0;
        const bChar = b.length > 0 ? b.charCodeAt(i % b.length) : 0;
        diff |= aChar ^ bChar;
      }
      return diff === 0;
    }

    // Résolution de l'authentification : Clé API utilisateur enregistrée, Clé système, ou Token JWT
    if (apiKey) {
      // Le préfixe de tier n'est une indication de confiance qu'après avoir
      // validé la clé dans la base : une chaîne mai-pro-... ne doit jamais
      // suffire à obtenir un contexte payant.
      const keyTier = extractTierFromApiKey(apiKey);

      try {
        const sql = getDb();
        const rows = await sql`
          SELECT k.*, u.tier as user_tier, u.id as u_id
          FROM mprojects_api_keys k
          LEFT JOIN users u ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
          WHERE k.api_key = ${apiKey}::text
          LIMIT 1
        `;

        if (rows.length > 0) {
          const apiKeyData = rows[0];
          // Si le TIER_USER a été extrait de la clé déjà validée, il fait foi
          // en priorité ; sinon on utilise le forfait de la base.
          if (keyTier) {
            userPlan = keyTier;
          } else {
            const rawPlan = String(apiKeyData.plan || "").trim().toLowerCase();
            const validTiers = ["free", "plus", "pro", "max"];
            userPlan = apiKeyData.user_tier || (validTiers.includes(rawPlan) ? apiKeyData.plan : "Plus");
          }
          currentUserId = String(apiKeyData.user_id || apiKeyData.u_id || "").trim();
          if (!currentUserId) {
            throw new Error("API key has no owner");
          }
          matchedApiKey = apiKeyData.api_key || apiKey;
          isRegisteredApiKey = true;
        } else if (systemMaiApiKey && timingSafeEqual(apiKey, systemMaiApiKey)) {
          userPlan = "Plus";
          currentUserId = "system-mai";
          isSystemAuth = true;
        } else {
          // Tenter de valider le token comme un JWT de session
          try {
            const payload = await verifyToken(apiKey);
            const subject = String(payload.sub || "").trim();
            if (!subject) {
              throw new Error("JWT has no subject");
            }
            currentUserId = subject;
            isJwtAuth = true;
            userPlan = String(payload.tier || "Free");

            // Vérifier dans la table users si le forfait a changé. Cette
            // lecture est best-effort : la signature JWT suffit pour
            // autoriser la route et un logout doit rester possible.
            if (currentUserId) {
              try {
                const uRows = await sql`
                  SELECT tier FROM users
                  WHERE id::text = ${currentUserId}::text OR username = ${currentUserId}::text OR email = ${currentUserId}::text
                  LIMIT 1
                `;
                if (uRows.length > 0 && uRows[0].tier) {
                  userPlan = uRows[0].tier;
                }
              } catch {
                // Le tier JWT reste utilisable si cette lecture best-effort échoue.
              }
            }
          } catch {
            if (!isPublicRoute) {
              return c.json({ error: "Invalid API Key." }, 403);
            }
          }
        }
      } catch {
        currentUserId = null;
        matchedApiKey = null;
        isRegisteredApiKey = false;
        isJwtAuth = false;
        isSystemAuth = false;
        userPlan = "Free";
        // Si la table des clés est momentanément indisponible, un JWT signé
        // peut encore être validé sans concession d'identité ni de tier.
        try {
          const payload = await verifyToken(apiKey);
          const subject = String(payload.sub || "").trim();
          if (!subject) throw new Error("JWT has no subject");
          currentUserId = subject;
          isJwtAuth = true;
          userPlan = String(payload.tier || "Free");
        } catch {
          if (!isPublicRoute) {
            return c.json({ error: "Invalid API Key." }, 403);
          }
          console.error("[Auth] credential lookup failed");
        }
      }
    }

    // 3. En-tête x-user-id (requêtes web app / internes) : uniquement si déjà authentifié ou fallback route publique
    if (reqUserId && reqUserId !== "system-mai") {
      if (currentUserId) {
        // Déjà authentifié via clé API ou JWT : x-user-id doit correspondre, sinon on l'ignore
        if (reqUserId !== currentUserId) {
          console.warn("[Auth] x-user-id mismatch — header ignoré");
        }
      } else if (apiKey) {
        // apiKey présent mais non reconnu (route publique) : ne pas promouvoir via x-user-id seul
      } else {
        // Aucune auth vérifiée
        try {
          const sql = getDb();
          const uRows = await sql`
            SELECT tier FROM users 
            WHERE id::text = ${reqUserId}::text OR username = ${reqUserId}::text OR email = ${reqUserId}::text 
            LIMIT 1
          `;
          if (uRows.length > 0) {
            if (uRows[0].tier) {
              userPlan = uRows[0].tier;
            }
            if (isPublicRoute) {
              currentUserId = reqUserId;
            } else {
              console.warn("[Auth] x-user-id sans JWT sur route privée — ignoré");
            }
          }
        } catch {
          // Une résolution x-user-id best-effort ne doit pas contourner l'auth.
        }
      }
    }

    // 4. Aucun identifiant et route privée
    if (!apiKey && !currentUserId && !isPublicRoute) {
      return c.json({ error: "Service Unavailable. API Key missing." }, 401);
    }

    // Enregistrer le plan et les infos de contexte
    (c as any).set("userPlan", userPlan);
    (c as any).set("userId", currentUserId);
    // Ne jamais repasser une clé non reconnue aux handlers : certains
    // handlers l'utilisent comme credential fournisseur. Les JWT et la clé
    // système restent disponibles via le contexte pour les flux query-token.
    (c as any).set("apiKey", isRegisteredApiKey ? matchedApiKey : (isJwtAuth || isSystemAuth) ? apiKey : null);
    (c as any).set("matchedApiKey", isRegisteredApiKey ? matchedApiKey : null);

    // Vérification préventive du quota de requêtes pour les clés API enregistrées.
    // Le solde est global au compte (cumul de toutes ses clés) et la période est hebdomadaire
    // (lundi 00:00 UTC), marquée par usage_period_start pour un reset idempotent.
    // Un token JWT de session ne consomme pas ce quota : la requête est exécutée directement.
    if (isRegisteredApiKey && currentUserId && currentUserId !== "system-mai") {
      try {
        const sql = getDb();
        const { nextResetIso, weekStartStr } = getWeekData();
        const apiBoost = await getUserQuotaBoost(sql, currentUserId, "api");
        const limit = getTierRequestLimit(userPlan) + apiBoost;

        await sql`
          UPDATE mprojects_api_keys
          SET request_count = 0, usage_period_start = ${weekStartStr}::date
          WHERE user_id::text = ${currentUserId}::text
            AND usage_period_start IS DISTINCT FROM ${weekStartStr}::date
        `;

        const countRows = await sql`
          SELECT SUM(request_count) as total_requests
          FROM mprojects_api_keys
          WHERE user_id::text = ${currentUserId}::text
        `;
        // Neon renvoie les bigint en chaîne: Number() est obligatoire pour comparer
        const used = Number(countRows[0]?.total_requests || 0);
        const remaining = Math.max(0, limit - used);

        (c as any).set("requestQuota", { apiKey: matchedApiKey, limit, remaining, used });

        if (remaining < 1) {
          if (isPublicRoute) {
            await next();
            return;
          }
          return c.json({
            code: "quota_exceeded",
            error: "Quota exceeded for your account.",
            limit,
            remaining,
            resetAt: nextResetIso,
            used,
          }, 429);
        }
      } catch {
        if (!isPublicRoute) {
          return c.json({ error: "Service temporarily unavailable." }, 503);
        }
      }
    }

    await next();

    const latency = Date.now() - startTime;
    const status = c.res.status;
    const endpoint = c.req.path;
    const method = c.req.method;

    // Log-usage & Décompte de 1 requête du quota API (chat, audio, images, web search, etc.).
    // Uniquement pour les clés API enregistrées : +1 requête au solde hebdomadaire du
    // propriétaire de la clé. Les requêtes authentifiées par JWT de session sont
    // exécutées directement, sans log-usage ni débit ensuite.
    const isExcludedRoute = path.startsWith("/v1/devices") || path === "/v1/status" || path === "/status";
    if (!isExcludedRoute && isRegisteredApiKey) {
      try {
        const sql = getDb();
        const effectiveKeyToLog = matchedApiKey || apiKey;

        await sql`
          INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms)
          VALUES (${effectiveKeyToLog}::text, ${endpoint}::text, ${method}::text, ${status}::integer, ${latency}::integer)
        `;

        // Les routes qui débitent elles-mêmes un coût multi-crédits (images) posent le fanion
        // pour éviter le double débit `cout + 1` sur la même requête.
        if (status === 200 && !(c as any).get?.("quotaDebitedByHandler")) {
          await sql`
            UPDATE mprojects_api_keys
            SET request_count = request_count + 1, last_used_at = NOW()
            WHERE api_key = ${effectiveKeyToLog}::text
          `;
        }
      } catch {
        console.error("[Api] usage logging failed");
      }
    }
  });
}
