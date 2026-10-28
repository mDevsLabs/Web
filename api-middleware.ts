import type { Hono } from "npm:hono@4";
import {
  releaseApiRequestQuota,
  reserveApiQuotaOrRefuse,
} from "./api-quota.ts";
import {
  AccountBlockedError,
  AuthAuthorityUnavailableError,
} from "./auth-revocation.ts";
import {
  getDb,
  getTierRequestLimit,
  getUserQuotaBoost,
  getWeekData,
  normalizeTier,
  verifyToken,
} from "./config.ts";
import type { SqlClient } from "./openrouter-models.ts";

export function registerMiddleware(
  app: Hono,
  database: () => SqlClient = getDb
) {
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

    let rawApiKey =
      (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader) ||
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
    const startTime = Date.now();

    const systemMaiApiKey = Deno.env.get("MAI_API_KEY");

    let userPlan = "Free";
    let currentUserId: string | null = null;
    const currentApiKey: string | null = apiKey;
    let matchedApiKey: string | null = null;
    // Authentification par clé API enregistrée (par opposition à un JWT de session ou à la clé système)
    let isRegisteredApiKey = false;

    function timingSafeEqual(a: string, b: string): boolean {
      if (a.length !== b.length) {
        return false;
      }
      let diff = 0;
      for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return diff === 0;
    }

    // Résolution de l'authentification : Clé API utilisateur enregistrée, Clé système, ou Token JWT.
    //
    // Aucun privilège n'est tiré du PRÉFIXE de la clé (`mai-max-…`) : une clé
    // inconnue ne doit pas ouvrir un catalogue payant. Après authentification,
    // seule la colonne `users.tier` (forfait actuel du compte) fait autorité ;
    // une clé créée sous un forfait supérieur suit donc une rétrogradation.
    if (apiKey) {
      try {
        // `database()` doit rester DANS le try : une base injoignable au moment de
        // l'ouverture est exactement le cas que ce bloc doit attraper, sinon
        // l'exception remonte hors du middleware et la requête n'est ni servie
        // ni refusée proprement.
        const sql = database();
        const rows = await sql`
          SELECT k.*, u.tier as user_tier, u.id as u_id, u.is_blocked as user_blocked
          FROM mprojects_api_keys k
          LEFT JOIN users u ON k.user_id = u.id::text OR k.user_id = u.username OR k.user_id = u.email
          WHERE k.api_key = ${apiKey}::text
          LIMIT 1
        `;

        if (rows.length > 0) {
          const apiKeyData = rows[0];
          // Une clé orpheline (propriétaire supprimé) n'authentifie personne :
          // elle ne peut ni recevoir un forfait de repli ni consommer un quota.
          const ownerExists = Boolean(apiKeyData.u_id);
          const keyActive = apiKeyData.is_active !== false;

          if (apiKeyData.user_blocked === true) {
            return c.json(
              {
                blocked: true,
                error:
                  "Ce compte est bloqué. Contactez le support pour demander sa réactivation.",
              },
              403
            );
          }

          if (!keyActive || !ownerExists) {
            // Route publique : la clé n'accorde RIEN, la requête reste au
            // niveau public le plus strict. Route privée : refus explicite.
            if (!isPublicRoute) {
              return c.json({ error: "Invalid API Key." }, 403);
            }
          } else {
            userPlan = normalizeTier(apiKeyData.user_tier);
            currentUserId = String(apiKeyData.u_id);
            matchedApiKey = apiKeyData.api_key || apiKey;
            isRegisteredApiKey = true;
          }
        } else if (
          systemMaiApiKey &&
          timingSafeEqual(apiKey, systemMaiApiKey)
        ) {
          userPlan = "Plus";
          currentUserId = "system-mai";
        } else {
          // Tenter de valider le token comme un JWT de session.
          //
          // Le try interne ne couvre QUE la vérification du jeton : un état
          // d'autorité indisponible est une panne (503), un jeton révoqué ou
          // un compte bloqué est un refus (403).
          let sessionPayload: { sub?: string; tier?: string } | null = null;
          try {
            sessionPayload = (await verifyToken(apiKey)) as {
              sub?: string;
              tier?: string;
            };
          } catch (tokenError) {
            if (tokenError instanceof AuthAuthorityUnavailableError) {
              console.error(
                "[auth] Autorité de session indisponible:",
                tokenError.message
              );
              return c.json(
                { error: "Authentication service unavailable." },
                503
              );
            }
            if (tokenError instanceof AccountBlockedError) {
              return c.json(
                {
                  blocked: true,
                  error:
                    "Ce compte est bloqué. Contactez le support pour demander sa réactivation.",
                },
                403
              );
            }
            if (!isPublicRoute) {
              return c.json({ error: "Invalid API Key." }, 403);
            }
          }
          if (sessionPayload) {
            const subject = String(sessionPayload.sub || "");
            if (subject) {
              const uRows = await sql`
                SELECT tier, is_blocked FROM users
                WHERE id::text = ${subject}::text OR username = ${subject}::text OR email = ${subject}::text
                LIMIT 1
              `;
              if (uRows.length > 0) {
                if (uRows[0].is_blocked === true) {
                  return c.json(
                    {
                      blocked: true,
                      error:
                        "Ce compte est bloqué. Contactez le support pour demander sa réactivation.",
                    },
                    403
                  );
                }
                if (uRows[0].tier) {
                  userPlan = normalizeTier(uRows[0].tier);
                }
                currentUserId = subject;
              } else if (!isPublicRoute) {
                // Jeton signé d'un compte disparu : aucun accès.
                return c.json({ error: "Invalid API Key." }, 403);
              }
            }
          }
        }
      } catch (dbErr) {
        // Échec de la base d'authentification : on REFUSE la requête.
        //
        // Avaler cette erreur revenait à laisser passer la requête avec
        // `currentUserId` à null : le garde 401 plus bas teste `!apiKey`, qui est
        // renseigné, donc aucune route privée n'était protégée et le handler
        // s'exécutait sans identité établie. Une panne d'infrastructure ne doit
        // jamais accorder un accès ; on répond 503 pour que l'appelant
        // réessaie, et on n'appelle ni `next()` ni `c.set()`.
        console.error("Auth DB Error in middleware:", dbErr);
        return c.json({ error: "Authentication service unavailable." }, 503);
      }
    }

    // Aucune promotion d'identité depuis `x-user-id` : un en-tête fourni par le
    // client n'est pas une authentification. Les handlers publics qui veulent
    // un spectateur doivent vérifier eux-mêmes le JWT.
    const reqUserId = c.req.header("x-user-id") || c.req.header("X-User-Id");
    if (
      reqUserId &&
      reqUserId !== "system-mai" &&
      currentUserId &&
      reqUserId !== currentUserId
    ) {
      console.warn(
        `[Auth] x-user-id mismatch: header=${reqUserId} vs auth=${currentUserId} — header ignoré`
      );
    }

    // 4. Aucun identifiant et route privée
    if (!apiKey && !currentUserId && !isPublicRoute) {
      return c.json({ error: "Service Unavailable. API Key missing." }, 401);
    }

    // Enregistrer le plan et les infos de contexte
    c.set("userPlan", userPlan);
    c.set("userId", currentUserId);
    c.set("apiKey", currentApiKey);
    c.set("matchedApiKey", matchedApiKey);

    // Réservation atomique du quota de requêtes pour les clés API enregistrées.
    // Le solde est global au compte (cumul de toutes ses clés) et la période est
    // hebdomadaire (lundi 00:00 UTC, reset idempotent par usage_period_start).
    // La place est débitée AVANT le handler : deux requêtes concurrentes ne
    // peuvent plus lire le même solde puis dépasser la limite.
    // Un JWT de session ne consomme pas ce quota.
    let quotaReserved = false;
    if (isRegisteredApiKey && currentUserId && matchedApiKey) {
      const sql = database();
      const { nextResetIso, weekStartStr } = getWeekData();
      const apiBoost = await getUserQuotaBoost(sql, currentUserId, "api");
      const limit = getTierRequestLimit(userPlan) + apiBoost;
      const quota = await reserveApiQuotaOrRefuse(sql, {
        apiKey: matchedApiKey,
        limit,
        userId: currentUserId,
        weekStartStr,
      });

      if (quota.status === "unavailable") {
        // Sans réponse de l'autorité de quota, le handler ne doit JAMAIS être
        // appelé : ni `next()` ni fournisseur. On distingue plus bas le
        // dépassement établi (429) de cette indisponibilité (503).
        console.error(
          "[quota] Contrôle du quota API indisponible:",
          quota.error instanceof Error
            ? quota.error.message
            : String(quota.error)
        );
        return c.json(
          { error: "Quota service unavailable. Please retry later." },
          503
        );
      }

      (c as any).set("requestQuota", {
        apiKey: matchedApiKey,
        limit: quota.limit,
        remaining: quota.status === "reserved" ? quota.remaining : 0,
        used: quota.used,
      });

      if (quota.status === "reserved") {
        quotaReserved = true;
      } else if (!isPublicRoute) {
        if (quota.status === "key_exhausted") {
          return c.json(
            {
              code: "api_key_limit_exceeded",
              error: "Cette clé API a atteint sa limite individuelle.",
              limit: quota.limit,
              remaining: 0,
              used: quota.used,
            },
            429
          );
        }
        return c.json(
          {
            code: "quota_exceeded",
            error: "Quota exceeded for your account.",
            limit,
            remaining: 0,
            resetAt: nextResetIso,
            used: quota.used,
          },
          429
        );
      }
      // Route publique sans place disponible : la requête reste servie au
      // niveau public, sans débit supplémentaire (comportement documenté).
    }

    let handlerError: unknown = null;
    try {
      await next();
    } catch (error) {
      // Le handler a levé : sa réservation doit être rendue avant de propager.
      handlerError = error;
    }

    const latency = Date.now() - startTime;
    const status = handlerError ? 500 : c.res.status;
    const endpoint = c.req.path;
    const method = c.req.method;

    // Log-usage & libération éventuelle de la réservation.
    // La réservation reste comptée sur un succès ; elle est rendue si le
    // handler a échoué, ou s'il a débité lui-même le coût complet (images).
    const isExcludedRoute =
      path.startsWith("/v1/devices") ||
      path === "/v1/status" ||
      path === "/status";
    if (!isExcludedRoute && isRegisteredApiKey) {
      try {
        const sql = database();
        const effectiveKeyToLog = matchedApiKey || apiKey;

        const handlerDebited = Boolean(
          (c as any).get?.("quotaDebitedByHandler")
        );
        if (
          quotaReserved &&
          (handlerError || status !== 200 || handlerDebited)
        ) {
          await releaseApiRequestQuota(sql, effectiveKeyToLog as string);
        }

        await sql`
          INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms)
          VALUES (${effectiveKeyToLog}::text, ${endpoint}::text, ${method}::text, ${status}::integer, ${latency}::integer)
        `;
      } catch (err) {
        console.error("Erreur logging API & mise à jour quota:", err);
      }
    }

    if (handlerError) {
      throw handlerError;
    }
  });
}
