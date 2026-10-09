/**
 * ============================================================================
 * mAI — TRADUCTION DES MESSAGES (mai-translate.ts)
 * POST /v1/mai/translate : traduction d'un texte libre (réponse de l'IA) via
 * l'API DeepL, avec cache persistant par empreinte du texte.
 *  - DEEPL_API_KEY   : clé principale (variables Val Town)
 *  - DEEPL_API_KEY_2 : clé de secours, essayée si la première échoue
 * Les clés gratuites (suffixe « :fx ») sont routées vers api-free.deepl.com.
 *
 * POURQUOI CE FICHIER EST SÉPARÉ DE translate.ts
 * translate.ts sert le réseau social Vibe : il traduit des publications et des
 * commentaires identifiés par UUID, lit sa cible dans `user_settings`, bascule
 * vers la langue opposée quand le texte est déjà dans la langue cible, et
 * débite un quota utilisateur Vibe. Aucune de ces quatre règles n'a de sens
 * pour une réponse de conversation mAI. Réutiliser ce fichier obligerait à
 * conditionner chaque branche sur le produit appelant ; on préfère deux
 * modules dont aucun ne connaît l'existence de l'autre.
 *
 * Ce module reste volontairement AUTO-SUFFISANT (helpers dupliqués depuis
 * translate.ts) : un déploiement partiel de Val Town peut servir ce fichier
 * sans translate.ts, et l'inverse. Un import croisé ferait tomber le boot.
 *
 * Le repli sur un modèle mAI n'est PAS ici : MAIAgentFleet résout la clé et le
 * modèle par `Number(userId)` sur la table `users` de Vibe, ce qui renvoie
 * `null` pour un identifiant Next (UUID). Le repli vit dans la BFF
 * (`app/(chat)/api/translate/route.ts`), qui possède le modèle, le forfait et
 * la comptabilité de quota. Ici, DeepL indisponible = 503 explicite.
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, rateLimit, verifyToken } from "./config.ts";
import { createRegisterMulti } from "./vibe-common.ts";

/**
 * Codes cibles acceptés par DeepL /v2/translate (target_lang).
 *
 * Volontairement sans les variantes régionales : DeepL raisonne sur ces
 * codes-là, et un `EN` ou un `ZH` générique traduit mieux qu'un code
 * inexistant. `ZH` n'existe pas : DeepL attend ZH-HANS / ZH-HANT.
 */
const DEEPL_TARGET_LANGS = new Set([
  "AR",
  "BG",
  "CS",
  "DA",
  "DE",
  "EL",
  "EN",
  "ES",
  "ET",
  "FI",
  "FR",
  "HE",
  "HU",
  "ID",
  "IT",
  "JA",
  "KO",
  "LT",
  "LV",
  "NB",
  "NL",
  "PL",
  "PT",
  "RO",
  "RU",
  "SK",
  "SL",
  "SV",
  "TR",
  "UK",
  "VI",
  "ZH",
]);

/** Variantes régionales explicitement supportées. */
const DEEPL_TARGET_VARIANTS = new Set([
  "EN-GB",
  "EN-US",
  "PT-BR",
  "PT-PT",
  "ZH-HANT",
  "ZH-HANS",
]);

/** Longueur maximale envoyée par requête DeepL (le palier gratuit plafonne à 5 000). */
const DEEPL_MAX_CHARS = 4500;

/** Garde-fou applicatif : au-delà, le découpage ne sert plus à rien. */
const MAX_INPUT_CHARS = 20_000;

/**
 * Normalise « fr », « en-us », « pt_BR »… vers un code DeepL valide, ou `null`.
 *
 * `null` — et non une valeur de repli — pour que l'appelant puisse répondre
 * 400 : deviner une langue à la place de l'utilisateur traduirait dans une
 * langue qu'il n'a pas demandée.
 */
function normalizeTargetLang(raw: string): string | null {
  const upper = String(raw || "")
    .trim()
    .toUpperCase()
    .replace("_", "-");
  if (!upper) return null;
  if (DEEPL_TARGET_VARIANTS.has(upper)) return upper;
  const base = upper.slice(0, 2);
  if (base === "EN") return "EN";
  if (base === "PT") return "PT-BR";
  if (base === "ZH") return "ZH-HANS";
  return DEEPL_TARGET_LANGS.has(base) ? base : null;
}

/** Les clés DeepL gratuites (suffixe « :fx ») utilisent un host dédié. */
function deeplHost(key: string): string {
  return key.endsWith(":fx")
    ? "https://api-free.deepl.com"
    : "https://api.deepl.com";
}

/** Clés DeepL dans l'ordre de priorité (DEEPL_API_KEY puis DEEPL_API_KEY_2). */
function getDeeplKeys(): string[] {
  const read = (name: string) =>
    (typeof Deno === "undefined" ? null : Deno.env?.get(name)) ||
    (typeof process === "undefined" ? null : (process.env as any)?.[name]) ||
    "";
  return [read("DEEPL_API_KEY"), read("DEEPL_API_KEY_2")]
    .map((k) => String(k).trim())
    .filter(Boolean);
}

/**
 * Découpe un texte long en morceaux envoyables par DeepL.
 *
 * On découpe sur un blanc, jamais au milieu d'un mot : une coupure en pleine
 * syllabe produit une traduction qui perd un mot de liaison. Si un « mot » est
 * à lui seul plus long que le plafond (une URL, une empreinte), il part seul :
 * DeepL le refusera, mais le reste du message est tout de même traduit.
 */
function chunkForDeepl(text: string): string[] {
  if (text.length <= DEEPL_MAX_CHARS) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > DEEPL_MAX_CHARS) {
    const window = rest.slice(0, DEEPL_MAX_CHARS);
    // dernier espace avant le plafond : coupe la plus propre possible
    let cut = window.lastIndexOf(" ");
    if (cut < DEEPL_MAX_CHARS * 0.5) {
      // Aucun espace exploitable : coupe plus tôt plutôt qu'au milieu d'un mot.
      cut = window.lastIndexOf("\n");
    }
    if (cut <= 0) cut = DEEPL_MAX_CHARS;
    chunks.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks.filter(Boolean);
}

/** Appel DeepL /v2/translate : essaie chaque clé dans l'ordre (fallback simple). */
async function callDeepl(
  text: string,
  targetLang: string
): Promise<{ text: string; detected: string }> {
  const keys = getDeeplKeys();
  if (keys.length === 0)
    throw new Error("Aucune clé DeepL configurée (DEEPL_API_KEY).");
  const errors: string[] = [];
  for (const key of keys) {
    try {
      const res = await fetch(`${deeplHost(key)}/v2/translate`, {
        body: JSON.stringify({
          tag_handling: "html",
          target_lang: targetLang,
          text: [text],
        }),
        headers: {
          Authorization: `DeepL-Auth-Key ${key}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        errors.push(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const tr = data?.translations?.[0];
      if (!tr?.text) {
        errors.push("réponse vide");
        continue;
      }
      return {
        detected: String(tr.detected_source_language || "").toUpperCase(),
        text: String(tr.text),
      };
    } catch (err: any) {
      errors.push(err?.message || "erreur réseau");
    }
  }
  throw new Error(`DeepL indisponible (${errors.join(" ; ")})`);
}

/** Deux langues sont « la même » si leurs deux premiers caractères coïncident. */
function sameLanguage(detected: string, target: string): boolean {
  return Boolean(detected) && detected.slice(0, 2) === target.slice(0, 2);
}

/** Empreinte du texte : clé de cache stable et sans collision pratique. */
async function textHash(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function registerMaiTranslateRoutes(app: Hono) {
  if ((app as any).__mai_translate_registered) return;
  (app as any).__mai_translate_registered = true;

  const registerMulti = createRegisterMulti(app);

  // Table de cache créée paresseusement (idempotent) : une migration DDL à
  // chaque déploiement serait plus propre, mais cette route peut tourner sur un
  // environnement Val Town dont le runner de migration n'a pas encore passé.
  let cacheReady = false;
  const ensureCacheTable = async () => {
    if (cacheReady) return;
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS mai_message_translations (
        content_hash TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        detected_language TEXT,
        translation TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (content_hash, target_lang)
      )
    `;
    cacheReady = true;
  };

  const handleTranslate = async (c: any) => {
    let sql: any;
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      // L'identifiant n'est PAS forcé en nombre : un utilisateur mAI Web est un
      // UUID. Il ne sert qu'à borner le débit, jamais à lire une table Vibe.
      const userId = String(payload.sub || (payload as any).id || "").trim();
      if (!userId) return c.json({ error: "Non authentifié." }, 401);

      if (!rateLimit(`mai-translate:${userId}`, 20, 60_000)) {
        return c.json(
          { error: "Trop de traductions. Patientez quelques instants." },
          429
        );
      }

      const body = await c.req.json().catch(() => ({}) as any);
      const text = String(body?.text || "").trim();
      if (!text) {
        return c.json({ error: "Aucun texte à traduire." }, 400);
      }
      if (text.length > MAX_INPUT_CHARS) {
        return c.json(
          {
            error: `Message trop long (${text.length} caractères, maximum ${MAX_INPUT_CHARS}).`,
          },
          400
        );
      }

      const targetLang = normalizeTargetLang(String(body?.target_lang || ""));
      if (!targetLang) {
        return c.json({ error: "Langue cible non prise en charge." }, 400);
      }

      sql = getDb();
      await ensureCacheTable().catch(() => {});

      // 1. Cache : le même message relu trois fois ne coûte qu'un appel DeepL.
      const contentHash = await textHash(text);
      try {
        const cached = await sql`
          SELECT translation, detected_language
          FROM mai_message_translations
          WHERE content_hash = ${contentHash} AND target_lang = ${targetLang}
          LIMIT 1
        `;
        if (cached.length > 0) {
          const detected = String(cached[0].detected_language || "");
          return c.json({
            cached: true,
            detected_language: detected,
            provider: "deepl",
            same_language: sameLanguage(detected, targetLang),
            success: true,
            target_lang: targetLang,
            translation: cached[0].translation,
          });
        }
      } catch {
        // Cache indisponible : on traduit quand même, la traduction coûte plus
        // que l'échec de lecture.
      }

      // 2. Traduction, par morceaux si le message dépasse le plafond DeepL.
      const chunks = chunkForDeepl(text);
      const translated: string[] = [];
      let detected = "";
      for (const chunk of chunks) {
        const result = await callDeepl(chunk, targetLang);
        translated.push(result.text);
        if (!detected) detected = result.detected;
      }
      const translation = translated.join("\n\n");

      // 3. Cache. On n'écrit jamais une traduction identique à la source : elle
      //    ne serait jamais relue comme une traduction, seulement comme le texte
      //    d'origine, et elle masquerait le cas « déjà dans la langue cible ».
      const alreadyInTarget = sameLanguage(detected, targetLang);
      if (!alreadyInTarget && translation && translation !== text) {
        try {
          await sql`
            INSERT INTO mai_message_translations
              (content_hash, target_lang, detected_language, translation)
            VALUES (${contentHash}, ${targetLang}, ${detected}, ${translation})
            ON CONFLICT (content_hash, target_lang) DO UPDATE
              SET translation = EXCLUDED.translation,
                  detected_language = EXCLUDED.detected_language
          `;
        } catch {
          // Idempotent : un échec d'écriture ne doit pas faire perdre la
          // traduction déjà obtenue.
        }
      }

      return c.json({
        cached: false,
        detected_language: detected,
        provider: "deepl",
        same_language: alreadyInTarget,
        success: true,
        target_lang: targetLang,
        translation: alreadyInTarget ? text : translation,
      });
    } catch (err: any) {
      // DeepL indisponible : la BFF bascule sur son repli mAI. Un 503
      // explicite plutôt qu'une 500, pour que ce choix soit lisible.
      console.warn("[mai-translate] traduction impossible:", err?.message);
      return c.json(
        {
          error: "Moteur de traduction indisponible.",
          provider_unavailable: true,
        },
        503
      );
    }
  };

  // `/v1/translate` est déjà pris par translate.ts (réseau social Vibe) : cette
  // route ne doit surtout pas le réécrire, sinon la traduction Vibe casserait
  // en silence.
  registerMulti(
    "post",
    ["/v1/mai/translate", "/mai/translate"],
    handleTranslate
  );
}
