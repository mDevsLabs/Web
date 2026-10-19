/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — STORIES (vibe-stories.ts)
 * Publications éphémères de 24 h, photo ou vidéo de 50 Mo au plus, annoncées
 * par un anneau autour de la photo de profil puis conservées en archive.
 *
 *  - GET    /v1/stories/tray       rail du jour, groupé par auteur
 *  - POST   /v1/stories            publication — média, texte, sondage, stickers
 *  - GET    /v1/stories/active     mes stories live
 *  - GET    /v1/stories/archive    mes stories archivées
 *  - PATCH  /v1/stories/:id        légende, visibilité, archive volontaire
 *  - DELETE /v1/stories/:id        suppression (soft, donc réversible)
 *  - POST   /v1/stories/:id/view   vue, idempotente
 *  - POST   /v1/stories/:id/react  réaction dans l'allowlist
 *  - POST   /v1/stories/:id/vote   vote au sondage, un par compte (modifiable)
 *  - GET    /v1/stories/:id/views  qui a regardé — auteur seul
 *
 * Trois états, dérivés et non stockés comme tels :
 *   live      deleted_at IS NULL AND archived_at IS NULL AND expires_at > NOW()
 *   archivée  deleted_at IS NULL AND (archived_at IS NOT NULL OR expires_at <= NOW())
 *   supprimée deleted_at IS NOT NULL  (invisible partout, rien n'est effacé)
 * L'expiration ne demande donc aucun cron : c'est un prédicat de lecture.
 *
 * Le DDL vit ici (`ensureStoriesTables`, créé au premier appel) ET dans
 * apps/vibe/lib/db/migrations/026_vibe_stories.sql, qui documente et équipe la
 * base de l'app mobile. Ce fichier a une copie jumelle dans `scripts/`,
 * identique au byte près (docs/2-vibe/AGENTS.md §4).
 *
 * FUSEAU DU QUOTA — minuit Europe/Paris, et non UTC comme le quota d'images
 * (`scripts/images.ts` compare sur CURRENT_DATE, qui est UTC). `usage_date` est
 * donc calculé ici et passé à l'upsert : laisser la base poser la date donnerait
 * un renouvellement à 1 h ou 2 h du matin pour un utilisateur francophone. La
 * divergence avec le quota images est délibérée — ce n'est pas un détail à
 * « réaligner » lors d'un nettoyage.
 *
 * PLAFOND MÉDIA — 50 Mo, tous forfaits, recontrôlé ICI. Le plafond de
 * `/upload-file` dépend désormais du forfait (1 Go pour les payants, voir
 * MEDIA_UPLOAD_LIMITS_BYTES dans config.ts) : transiter par cet endpoint ne
 * garantit donc plus la règle produit des stories. La taille est relue sur
 * l'objet par un HEAD, parce que `file_size_bytes` envoyé par le client est
 * falsifiable.
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import {
  extractTierFromApiKey as extractApiKeyTier,
  extractToken,
  getDb,
  getTierDailyStoryLimit,
  normalizeTier,
  verifyToken,
} from "./config.ts";
import {
  buildS3Client,
  findStorageNodeForRecord,
  formatQuotaBytes,
  getStorageNodes,
} from "./storage.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { isBlockEitherWay, resolveHiddenUserIds } from "./vibe-common.ts";

/** Durée de vie d'une story avant archivage automatique. */
export const STORY_TTL_HOURS = 24;
/** Taille maximale d'un média de story, tous forfaits (contrat produit). */
export const STORY_MEDIA_MAX_BYTES = 50 * 1024 * 1024;
/** Nombre maximal de médias dans une même story. */
export const STORY_MAX_ITEMS = 10;
/** Longueur maximale d'une légende — c'est aussi la story de texte seul. */
export const STORY_MAX_CAPTION = 500;
/** Nombre maximal de stickers posés sur une story. */
export const STORY_MAX_STICKERS = 6;
/** Bornes du sondage : une question, deux à quatre options lisibles. */
export const STORY_POLL_MAX_OPTIONS = 4;
export const STORY_POLL_MAX_OPTION = 60;
export const STORY_POLL_MAX_QUESTION = 120;
/** Réactions proposées par le lecteur. Hors de cette liste : refus. */
export const STORY_REACTIONS = ["❤️", "🔥", "😮"] as const;
/** Visibilités admises, en cohérence avec la CHECK de la migration 026. */
export const STORY_VISIBILITIES = ["followers", "public", "private"] as const;
/** Fuseau de référence du quota journalier. */
export const STORY_TIME_ZONE = "Europe/Paris";

/**
 * Namespace d'objet qu'une story peut revendiquer. `upload-file` écrit sous
 * `uploads/` : s'y limiter empêche de publier l'avatar ou le fichier cloud d'un
 * autre compte en le désignant par son chemin.
 */
const STORY_PATHNAME_PATTERN = /^uploads\/[A-Za-z0-9._-]+$/;

let storiesSchemaReady = false;

/** Miroir exact de la migration 026. Idempotent, et ne bloque pas le chargement. */
export async function ensureStoriesTables() {
  if (storiesSchemaReady) return;
  const sql = getDb();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS vibe_stories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        caption TEXT,
        visibility VARCHAR(20) NOT NULL DEFAULT 'followers',
        expires_at TIMESTAMPTZ NOT NULL,
        archived_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT vibe_stories_visibility_check
          CHECK (visibility IN ('followers', 'public', 'private'))
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_stories_author_active
        ON vibe_stories(user_id, expires_at DESC)
        WHERE deleted_at IS NULL
    `.catch(() => {});

    await sql`
      CREATE TABLE IF NOT EXISTS vibe_story_media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        pathname TEXT,
        media_type VARCHAR(20) NOT NULL,
        file_size_bytes BIGINT,
        position SMALLINT NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT vibe_story_media_type_check
          CHECK (media_type IN ('image', 'video'))
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_story_media_position
        ON vibe_story_media(story_id, position)
    `.catch(() => {});

    await sql`
      CREATE TABLE IF NOT EXISTS vibe_story_views (
        story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
        viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewed_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (story_id, viewer_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_story_views_recent
        ON vibe_story_views(story_id, viewed_at DESC)
    `.catch(() => {});

    await sql`
      CREATE TABLE IF NOT EXISTS vibe_story_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(8) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (story_id, user_id, emoji)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_story_reactions_story
        ON vibe_story_reactions(story_id)
    `.catch(() => {});

    // Le sondage et les stickers vivent SUR la story (JSONB), les votes dans
    // leur propre table : un compte = une ligne, rejouable pour changer d'option.
    await sql`
      ALTER TABLE vibe_stories ADD COLUMN IF NOT EXISTS poll JSONB
    `.catch(() => {});
    await sql`
      ALTER TABLE vibe_stories ADD COLUMN IF NOT EXISTS stickers JSONB
    `.catch(() => {});

    await sql`
      CREATE TABLE IF NOT EXISTS vibe_story_poll_votes (
        story_id UUID NOT NULL REFERENCES vibe_stories(id) ON DELETE CASCADE,
        voter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        option_index SMALLINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (story_id, voter_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_story_poll_votes_story
        ON vibe_story_poll_votes(story_id, option_index)
    `.catch(() => {});

    await sql`
      CREATE TABLE IF NOT EXISTS vibe_story_usage_daily (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        usage_date DATE NOT NULL,
        stories_created INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, usage_date)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_story_usage_date
        ON vibe_story_usage_daily(usage_date)
    `.catch(() => {});

    storiesSchemaReady = true;
  } catch (err) {
    console.error("[vibe-stories] ensure tables error:", err);
  }
}

/**
 * Jour « légal » de l'utilisateur : AAAA-MM-JJ en Europe/Paris.
 * `fr-CA` rend l'ordre ISO ; la DST est absorbée par Intl plutôt que par une
 * soustraction d'écart UTC que quelqu'un devrait recalculer à tort.
 */
export function getStoryDayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: STORY_TIME_ZONE,
    year: "numeric",
  })
    .format(now)
    .replace(/\//g, "-");
}

/** Millisecondes avant le prochain minuit parisien (compte à rebours d'interface). */
export function getMsUntilStoryReset(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
    timeZone: STORY_TIME_ZONE,
  }).formatToParts(now);
  const valeur = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || 0);
  const restant =
    (24 - valeur("hour")) * 3600 +
    (59 - valeur("minute")) * 60 +
    (60 - valeur("second"));
  return Math.max(0, restant * 1000);
}

/** Origines du pool de stockage : seules elles peuvent être revendiquées. */
function allowedMediaOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const node of getStorageNodes()) {
    for (const candidate of [node.endpoint, node.publicUrl]) {
      try {
        origins.add(new URL(candidate).origin);
      } catch {
        // Endpoint mal formé : on l'ignore, il ne peut pas devenir une autorisation.
      }
    }
  }
  return origins;
}

/**
 * Vérifie qu'un média revendiqué appartient bien au pool de stockage et à un
 * namespace d'envoi de l'appelant. Sans ce contrôle, un compte publierait
 * n'importe quelle URL externe dans le fil d'autrui — contenu illégitime servi
 * depuis un profil, et fuite d'IP du spectateur vers l'hôte choisi.
 */
export function resolveStoryMediaLocation(
  rawUrl: unknown,
  rawPathname: unknown
): { node: any; pathname: string; url: string } | null {
  const pathname = String(rawPathname || "").trim();
  if (!STORY_PATHNAME_PATTERN.test(pathname)) return null;

  let url: URL;
  try {
    url = new URL(String(rawUrl || ""));
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!allowedMediaOrigins().has(url.origin)) return null;

  const { node } = findStorageNodeForRecord(pathname, url.href);
  if (!node) return null;
  return { node, pathname, url: url.href };
}

/**
 * Taille réelle de l'objet, relue sur le stockage. `null` si l'objet est
 * injoignable : on refuse la publication plutôt que de retenir une story dont le
 * poids n'a jamais été vérifié.
 */
async function readStoredObjectSize(
  node: any,
  pathname: string
): Promise<number | null> {
  try {
    const client = await buildS3Client(node);
    const res = await client.fetch(
      `${node.endpoint}/${node.bucket}/${pathname}`,
      { method: "HEAD" }
    );
    if (!res.ok) return null;
    const length = Number(res.headers.get("content-length") || 0);
    return Number.isFinite(length) && length > 0 ? length : null;
  } catch (err) {
    console.error("[vibe-stories] HEAD media error:", err);
    return null;
  }
}

/** Identité du compte, ou null. Le jeton fait foi : jamais un champ du corps. */
async function storyUserId(c: any): Promise<number | null> {
  try {
    const token = extractToken(c.req.raw);
    if (!token) return null;
    const payload = await verifyToken(token);
    const id = Number(
      payload.sub || (payload as any).id || (payload as any).userId
    );
    return id && !Number.isNaN(id) ? id : null;
  } catch {
    return null;
  }
}

/** Forfait effectif : la base d'abord, le préfixe de clé API en repli, Free sinon. */
async function resolveStoryTier(
  userId: number,
  token: string
): Promise<string> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
    if (rows[0]?.tier) return normalizeTier(rows[0].tier);
  } catch {
    // Base muette : on retombe sur le jeton, jamais sur une valeur implicite haute.
  }
  return normalizeTier(extractApiKeyTier(token) || "Free");
}

/** JSONB relu par le pool : objet déjà décodé, ou chaîne selon le driver. */
function lireJsonb(valeur: any): any {
  if (typeof valeur !== "string") return valeur;
  try {
    return JSON.parse(valeur);
  } catch {
    return null;
  }
}

/** Depuis les agrégats SQL : compteurs par story et mon vote par story. */
function construireVotes(votesAgreges: any[], mesLignes: any[]) {
  const parStory = new Map<string, number[]>();
  for (const ligne of votesAgreges) {
    const cle = String(ligne.story_id);
    const compteurs = parStory.get(cle) || [];
    compteurs[Number(ligne.option_index)] = Number(ligne.votes || 0);
    parStory.set(cle, compteurs);
  }
  const miens = new Map<string, number>();
  for (const ligne of mesLignes) {
    miens.set(String(ligne.story_id), Number(ligne.option_index));
  }
  return { miens, parStory };
}

/**
 * Regroupe des lignes jointes story×média en rail groupé par auteur. Le JOIN est
 * un LEFT JOIN depuis les stories de texte : une story sans média arrive avec
 * `media_id` à NULL et n'ajoute simplement aucune entrée à `media`.
 */
function assemblerRail(
  lignes: any[],
  viewerId: number | null,
  vues: Set<string>,
  votesParStory: Map<string, number[]> = new Map(),
  mesVotes: Map<string, number> = new Map()
): any[] {
  const parAuteur = new Map<number, any>();
  const parStory = new Map<string, any>();

  for (const ligne of lignes) {
    const cle = String(ligne.id);
    let story = parStory.get(cle);
    if (!story) {
      const brutPoll = lireJsonb(ligne.poll);
      const options = Array.isArray(brutPoll?.options)
        ? brutPoll.options.filter((o: any) => typeof o === "string")
        : [];
      const compteurs = votesParStory.get(cle) || [];
      const counts = options.map((_: any, index: number) =>
        Number(compteurs[index] || 0)
      );
      const stickers = lireJsonb(ligne.stickers);

      story = {
        caption: ligne.caption || "",
        createdAt: ligne.created_at,
        expiresAt: ligne.expires_at,
        id: cle,
        media: [],
        // Un sondage amputé (question vide ou moins de deux options) ne
        // s'affiche pas : le serveur n'en crée jamais, mais une ligne
        // historicisée ne doit pas casser le lecteur.
        poll:
          brutPoll &&
          typeof brutPoll.question === "string" &&
          options.length >= 2
            ? {
                counts,
                myVote: mesVotes.has(cle) ? Number(mesVotes.get(cle)) : null,
                options,
                question: brutPoll.question,
                total: counts.reduce(
                  (somme: number, n: number) => somme + n,
                  0
                ),
              }
            : null,
        stickers: Array.isArray(stickers) ? stickers : [],
        visibility: ligne.visibility,
      };
      parStory.set(cle, story);

      const auteur = Number(ligne.user_id);
      let entree = parAuteur.get(auteur);
      if (!entree) {
        entree = {
          authorId: auteur,
          avatarUrl: ligne.avatar_url || null,
          displayName: ligne.display_name || ligne.username,
          isMine: Boolean(viewerId) && auteur === viewerId,
          seen: true,
          stories: [],
          username: ligne.username,
        };
        parAuteur.set(auteur, entree);
      }
      entree.stories.push(story);
    }

    if (ligne.media_id) {
      story.media.push({
        altText: ligne.alt_text || "",
        height: ligne.height ?? null,
        id: String(ligne.media_id),
        mediaType: ligne.media_type,
        position: Number(ligne.position || 0),
        url: ligne.url,
        width: ligne.width ?? null,
      });
    }
  }

  // L'anneau se grise quand TOUTES les stories de l'auteur sont vues ; une seule
  // inédite suffit à le maintenir actif.
  for (const entree of parAuteur.values()) {
    entree.seen = entree.stories.every((s: any) => vues.has(String(s.id)));
  }
  return Array.from(parAuteur.values());
}

export function registerVibeStoriesRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // Les chemins statiques (tray, active, archive) sont enregistrés AVANT
  // `/stories/:id` : Hono résout à l'ordre d'enregistrement, et « tray » sinon
  // se lirait comme un identifiant.

  // ── GET /v1/stories/tray — le rail de 24 h ────────────────────────────
  const handleStoriesTray = async (c: any) => {
    try {
      await ensureStoriesTables();
      const sql = getDb();
      const viewerId = await storyUserId(c);

      const [lignes, cache, abonnements, vues, votesAgreges, mesVotesLignes] =
        await Promise.all([
          sql`
          SELECT s.id, s.user_id, s.caption, s.visibility, s.created_at, s.expires_at,
                 s.poll, s.stickers,
                 u.username, p.display_name, p.avatar_url,
                 m.id AS media_id, m.url, m.media_type, m.position,
                 m.width, m.height, m.alt_text
          FROM vibe_stories s
          JOIN users u ON u.id = s.user_id
          LEFT JOIN profiles p ON p.user_id = s.user_id
          LEFT JOIN vibe_story_media m ON m.story_id = s.id
          WHERE s.deleted_at IS NULL
            AND s.archived_at IS NULL
            AND s.expires_at > NOW()
          ORDER BY s.created_at DESC, m.position ASC
          LIMIT 600
        `,
          resolveHiddenUserIds(viewerId),
          viewerId
            ? sql`SELECT following_id FROM follows WHERE follower_id = ${viewerId}`
            : Promise.resolve([] as any[]),
          viewerId
            ? sql`SELECT story_id FROM vibe_story_views WHERE viewer_id = ${viewerId}`
            : Promise.resolve([] as any[]),
          sql`
          SELECT v.story_id, v.option_index, COUNT(*)::int AS votes
          FROM vibe_story_poll_votes v
          JOIN vibe_stories s ON s.id = v.story_id
          WHERE s.deleted_at IS NULL AND s.expires_at > NOW()
          GROUP BY v.story_id, v.option_index
        `,
          viewerId
            ? sql`SELECT story_id, option_index FROM vibe_story_poll_votes WHERE voter_id = ${viewerId}`
            : Promise.resolve([] as any[]),
        ]);

      const follows = new Set(
        (abonnements as any[]).map((r) => Number(r.following_id))
      );
      const vuesSet = new Set((vues as any[]).map((r) => String(r.story_id)));
      const exclus = new Set([
        ...cache.blockedIds.map(Number),
        ...cache.mutedIds.map(Number),
      ]);

      // Visibilité : followers = abonné ou auteur, public = tout le monde,
      // private = auteur seul. Les propres stories d'un auteur ne se filtrent
      // jamais, même si un lien de blocage existe dans un sens.
      const autorise = (ligne: any) => {
        const auteur = Number(ligne.user_id);
        if (viewerId && auteur === viewerId) return true;
        if (viewerId && exclus.has(auteur)) return false;
        if (ligne.visibility === "public") return true;
        if (ligne.visibility === "followers") {
          return Boolean(viewerId) && follows.has(auteur);
        }
        return false;
      };

      const { miens, parStory } = construireVotes(
        votesAgreges as any[],
        mesVotesLignes as any[]
      );
      return c.json({
        stories: assemblerRail(
          (lignes as any[]).filter(autorise),
          viewerId,
          vuesSet,
          parStory,
          miens
        ),
        success: true,
      });
    } catch (err) {
      console.error("[vibe-stories] tray error:", err);
      return c.json({ error: "Erreur chargement des stories." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/stories/tray", "/vibe/stories/tray", "/v1/stories/tray"],
    handleStoriesTray
  );

  // ── GET /v1/stories/active et /v1/stories/archive — mes stories ───────
  const handleMyStories = (etat: "active" | "archive") => async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);

      await ensureStoriesTables();
      const sql = getDb();

      // Deux requêtes de plus, en parallèle des lignes : les compteurs du
      // sondage et mon vote, comme le rail — l'auteur voit les résultats.
      const [lignes, votesAgreges, mesVotesLignes] = await Promise.all([
        etat === "active"
          ? sql`
              SELECT s.id, s.user_id, s.caption, s.visibility, s.created_at, s.expires_at,
                     s.poll, s.stickers,
                     NULL::varchar AS display_name, NULL::varchar AS avatar_url,
                     '' AS username,
                     m.id AS media_id, m.url, m.media_type, m.position,
                     m.width, m.height, m.alt_text
              FROM vibe_stories s
              LEFT JOIN vibe_story_media m ON m.story_id = s.id
              WHERE s.user_id = ${userId}
                AND s.deleted_at IS NULL
                AND s.archived_at IS NULL
                AND s.expires_at > NOW()
              ORDER BY s.created_at DESC, m.position ASC
              LIMIT 400
            `
          : await sql`
              SELECT s.id, s.user_id, s.caption, s.visibility, s.created_at, s.expires_at,
                     s.poll, s.stickers,
                     NULL::varchar AS display_name, NULL::varchar AS avatar_url,
                     '' AS username,
                     m.id AS media_id, m.url, m.media_type, m.position,
                     m.width, m.height, m.alt_text
              FROM vibe_stories s
              LEFT JOIN vibe_story_media m ON m.story_id = s.id
              WHERE s.user_id = ${userId}
                AND s.deleted_at IS NULL
                AND (s.archived_at IS NOT NULL OR s.expires_at <= NOW())
              ORDER BY s.created_at DESC, m.position ASC
              LIMIT 400
            `,
        sql`
          SELECT v.story_id, v.option_index, COUNT(*)::int AS votes
          FROM vibe_story_poll_votes v
          JOIN vibe_stories s ON s.id = v.story_id
          WHERE s.user_id = ${userId}
          GROUP BY v.story_id, v.option_index
        `,
        sql`
          SELECT story_id, option_index FROM vibe_story_poll_votes
          WHERE voter_id = ${userId}
        `,
      ]);

      const { miens, parStory } = construireVotes(
        votesAgreges as any[],
        mesVotesLignes as any[]
      );
      const stories = assemblerRail(
        lignes as any[],
        userId,
        new Set(),
        parStory,
        miens
      );
      return c.json({ stories: stories[0]?.stories || [], success: true });
    } catch (err) {
      console.error(`[vibe-stories] ${etat} error:`, err);
      return c.json({ error: "Erreur chargement des stories." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/stories/active", "/vibe/stories/active", "/v1/stories/active"],
    handleMyStories("active")
  );
  registerMulti(
    "get",
    [
      "/api/vibe/stories/archive",
      "/vibe/stories/archive",
      "/v1/stories/archive",
    ],
    handleMyStories("archive")
  );

  // ── POST /v1/stories — publication, quota et médias contrôlés ────────
  const handleCreateStory = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Token invalide." }, 401);

      await ensureStoriesTables();
      const sql = getDb();

      const body = await c.req.json().catch(() => ({}));
      const items = Array.isArray(body?.items) ? body.items : [];
      if (items.length > STORY_MAX_ITEMS) {
        return c.json(
          { error: `Une story accepte au plus ${STORY_MAX_ITEMS} médias.` },
          400
        );
      }

      const caption =
        typeof body?.caption === "string"
          ? body.caption.trim().slice(0, STORY_MAX_CAPTION)
          : "";
      const visibility = (STORY_VISIBILITIES as readonly string[]).includes(
        body?.visibility
      )
        ? body.visibility
        : "followers";

      // Sondage : une question et au moins deux options lisibles. Un sondage
      // à moitié rempli est refusé plutôt que publié amputé.
      let poll: { options: string[]; question: string } | null = null;
      if (body?.poll && typeof body.poll === "object") {
        const question =
          typeof body.poll.question === "string"
            ? body.poll.question.trim().slice(0, STORY_POLL_MAX_QUESTION)
            : "";
        const options = (
          Array.isArray(body.poll.options) ? body.poll.options : []
        )
          .filter((option: any) => typeof option === "string")
          .map((option: string) =>
            option.trim().slice(0, STORY_POLL_MAX_OPTION)
          )
          .filter((option: string) => option.length > 0)
          .slice(0, STORY_POLL_MAX_OPTIONS);
        if (question && options.length >= 2) {
          poll = { options, question };
        } else if (question || options.length > 0) {
          return c.json(
            {
              error:
                "Sondage incomplet : une question et au moins deux options sont requises.",
            },
            400
          );
        }
      }

      // Stickers : bornés, replacés dans le canevas. Un point malformé est
      // ignoré plutôt que de faire échouer la publication.
      const stickers: Array<{ emoji: string; x: number; y: number }> = [];
      if (Array.isArray(body?.stickers)) {
        for (const brut of body.stickers) {
          const emoji =
            typeof brut?.emoji === "string" ? brut.emoji.slice(0, 8) : "";
          const x = Number(brut?.x);
          const y = Number(brut?.y);
          if (!emoji || !Number.isFinite(x) || !Number.isFinite(y)) continue;
          stickers.push({
            emoji,
            x: Math.min(1, Math.max(0, x)),
            y: Math.min(1, Math.max(0, y)),
          });
          if (stickers.length >= STORY_MAX_STICKERS) break;
        }
      }

      // Une story vide n'a pas de sens : média, légende ou sondage, au moins l'un.
      if (items.length === 0 && !caption && !poll) {
        return c.json(
          {
            error: "Story vide : ajoutez un média, une légende ou un sondage.",
          },
          400
        );
      }

      // Quota journalier, résolu AVANT toute écriture.
      const tier = await resolveStoryTier(userId, token);
      const limit = getTierDailyStoryLimit(tier);
      const dayKey = getStoryDayKey();
      const usage = await sql`
        SELECT stories_created FROM vibe_story_usage_daily
        WHERE user_id = ${userId} AND usage_date = ${dayKey}::date
        LIMIT 1
      `;
      const used = Number(usage[0]?.stories_created || 0);

      if (limit !== null && used >= limit) {
        // Forme d'erreur de Vibe : `error` est une CHAÎNE lisible, les champs
        // machine sont à plat. Le client (`ApiService.executeRequest`) fabrique
        // son message depuis `errJson.error` et son code depuis `errJson.code` :
        // imbriquer l'objet donnerait un « [object Object] » à l'écran.
        return c.json(
          {
            code: "daily_story_quota_exceeded",
            error: `Vous avez publié vos ${limit} stories du jour avec le forfait ${tier}. Réinitialisation à minuit, heure de Paris.`,
            limit,
            requested: items.length,
            resetsInMs: getMsUntilStoryReset(),
            type: "quota_error",
            used,
          },
          429
        );
      }

      // Chaque média est vérifié côté serveur : origine du pool, namespace
      // `uploads/`, type, puis taille relue sur l'objet. Le plafond story est
      // indépendant du plafond d'upload par forfait.
      const medias: Array<{
        altText: string;
        height: number | null;
        mediaType: string;
        pathname: string;
        position: number;
        sizeBytes: number;
        url: string;
        width: number | null;
      }> = [];

      for (const [index, item] of items.entries()) {
        const mediaType = String(item?.media_type || item?.mediaType || "");
        if (mediaType !== "image" && mediaType !== "video") {
          return c.json({ error: "Type de média non supporté." }, 400);
        }

        const location = resolveStoryMediaLocation(item?.url, item?.pathname);
        if (!location) {
          return c.json(
            {
              error:
                "Média inconnu : il doit résulter d'un envoi vers le stockage mAI.",
            },
            400
          );
        }

        const sizeBytes = await readStoredObjectSize(
          location.node,
          location.pathname
        );
        if (sizeBytes === null) {
          return c.json({ error: "Média introuvable sur le stockage." }, 400);
        }
        if (sizeBytes > STORY_MEDIA_MAX_BYTES) {
          return c.json(
            {
              error: `Média trop volumineux (${formatQuotaBytes(
                sizeBytes
              )}) : une story accepte ${formatQuotaBytes(
                STORY_MEDIA_MAX_BYTES
              )} au maximum, quel que soit le forfait.`,
            },
            413
          );
        }

        medias.push({
          altText:
            typeof item?.alt_text === "string"
              ? item.alt_text.slice(0, 500)
              : "",
          height: Number.isFinite(Number(item?.height))
            ? Number(item.height)
            : null,
          mediaType,
          pathname: location.pathname,
          position: index,
          sizeBytes,
          url: location.url,
          width: Number.isFinite(Number(item?.width))
            ? Number(item.width)
            : null,
        });
      }

      const storyId = crypto.randomUUID();
      await sql`
        INSERT INTO vibe_stories (id, user_id, caption, visibility, expires_at, poll, stickers)
        VALUES (
          ${storyId}::uuid,
          ${userId},
          ${caption || null},
          ${visibility},
          NOW() + make_interval(hours => ${STORY_TTL_HOURS}),
          ${poll ? JSON.stringify(poll) : null}::jsonb,
          ${stickers.length > 0 ? JSON.stringify(stickers) : null}::jsonb
        )
      `;

      for (const media of medias) {
        await sql`
          INSERT INTO vibe_story_media
            (story_id, url, pathname, media_type, file_size_bytes, position, width, height, alt_text)
          VALUES (
            ${storyId}::uuid, ${media.url}, ${media.pathname}, ${media.mediaType},
            ${media.sizeBytes}, ${media.position}, ${media.width}, ${media.height},
            ${media.altText || null}
          )
        `;
      }

      // Compteur : upsert sur la clé (user_id, usage_date), date parisienne.
      await sql`
        INSERT INTO vibe_story_usage_daily (user_id, usage_date, stories_created, updated_at)
        VALUES (${userId}, ${dayKey}::date, 1, NOW())
        ON CONFLICT (user_id, usage_date)
        DO UPDATE SET
          stories_created = vibe_story_usage_daily.stories_created + 1,
          updated_at = NOW()
      `;

      return c.json(
        {
          id: storyId,
          quota: {
            limit,
            remaining: limit === null ? null : Math.max(0, limit - (used + 1)),
            used: used + 1,
          },
          success: true,
        },
        201
      );
    } catch (err) {
      console.error("[vibe-stories] create error:", err);
      return c.json({ error: "Erreur lors de la publication." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/stories", "/vibe/stories", "/v1/stories", "/v1/stories/"],
    handleCreateStory
  );

  // ── PATCH /v1/stories/:id — édition bornée à l'auteur ────────────────
  const handlePatchStory = async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const id = String(c.req.param("id") || "");
      if (!id) return c.json({ error: "Story introuvable." }, 404);

      await ensureStoriesTables();
      const sql = getDb();

      const body = await c.req.json().catch(() => ({}));
      const caption =
        typeof body?.caption === "string" ? body.caption.slice(0, 500) : null;
      const visibility = (STORY_VISIBILITIES as readonly string[]).includes(
        body?.visibility
      )
        ? String(body.visibility)
        : null;
      const archiver = body?.archived === true;

      if (caption === null && visibility === null && !archiver) {
        return c.json({ error: "Rien à mettre à jour." }, 400);
      }

      // Clause écrite en entier, valeurs paramétrées : COALESCE garde la colonne
      // précédente quand le champ est absent du corps, et `null` n'est jamais
      // concaténé dans le SQL. `expires_at` ne bouge pas : renommer une story ne
      // prolonge pas sa fenêtre de 24 h.
      const lignes = await sql`
        UPDATE vibe_stories
        SET
          caption = COALESCE(${caption}::text, caption),
          visibility = COALESCE(${visibility}::varchar, visibility),
          archived_at = CASE
            WHEN ${archiver}::boolean THEN COALESCE(archived_at, NOW())
            ELSE archived_at
          END,
          updated_at = NOW()
        WHERE id = ${id}::uuid AND user_id = ${userId} AND deleted_at IS NULL
        RETURNING id, updated_at
      `;

      if (lignes.length === 0) {
        return c.json({ error: "Story introuvable ou accès refusé." }, 404);
      }
      return c.json({ id, success: true });
    } catch (err) {
      console.error("[vibe-stories] patch error:", err);
      return c.json({ error: "Erreur lors de la mise à jour." }, 500);
    }
  };

  registerMulti(
    "patch",
    ["/api/vibe/stories/:id", "/vibe/stories/:id", "/v1/stories/:id"],
    handlePatchStory
  );

  // ── DELETE /v1/stories/:id — soft delete, donc réversible ────────────
  const handleDeleteStory = async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const id = String(c.req.param("id") || "");
      if (!id) return c.json({ error: "Story introuvable." }, 404);

      await ensureStoriesTables();
      const sql = getDb();
      const lignes = await sql`
        UPDATE vibe_stories
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = ${id}::uuid AND user_id = ${userId} AND deleted_at IS NULL
        RETURNING id
      `;
      if (lignes.length === 0) {
        return c.json({ error: "Story introuvable ou accès refusé." }, 404);
      }
      return c.json({ id, success: true });
    } catch (err) {
      console.error("[vibe-stories] delete error:", err);
      return c.json({ error: "Erreur lors de la suppression." }, 500);
    }
  };

  registerMulti(
    "delete",
    ["/api/vibe/stories/:id", "/vibe/stories/:id", "/v1/stories/:id"],
    handleDeleteStory
  );

  // ── POST /v1/stories/:id/view — vue idempotente ──────────────────────
  const handleViewStory = async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const id = String(c.req.param("id") || "");
      if (!id) return c.json({ error: "Story introuvable." }, 404);

      await ensureStoriesTables();
      const sql = getDb();

      const [auteur] = await sql`
        SELECT user_id FROM vibe_stories
        WHERE id = ${id}::uuid AND deleted_at IS NULL
        LIMIT 1
      `;
      if (!auteur) return c.json({ error: "Story introuvable." }, 404);

      // Un compte qui a bloqué l'auteur, ou l'inverse, ne compte pas comme vue :
      // sinon la liste de l'auteur se peuplerait de spectateurs qu'il a écartés.
      if (await isBlockEitherWay(userId, Number(auteur.user_id))) {
        return c.json({ ignored: true, success: true });
      }

      await sql`
        INSERT INTO vibe_story_views (story_id, viewer_id)
        VALUES (${id}::uuid, ${userId})
        ON CONFLICT (story_id, viewer_id) DO NOTHING
      `;
      return c.body(null, 204);
    } catch (err) {
      console.error("[vibe-stories] view error:", err);
      return c.json(
        { error: "Erreur lors de l'enregistrement de la vue." },
        500
      );
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/stories/:id/view",
      "/vibe/stories/:id/view",
      "/v1/stories/:id/view",
    ],
    handleViewStory
  );

  // ── POST /v1/stories/:id/react — allowlist stricte ───────────────────
  const handleReactStory = async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const id = String(c.req.param("id") || "");
      const body = await c.req.json().catch(() => ({}));
      const emoji = String(body?.emoji || "");

      if (!id) return c.json({ error: "Story introuvable." }, 404);
      if (!(STORY_REACTIONS as readonly string[]).includes(emoji)) {
        return c.json(
          {
            error: `Réaction non autorisée. Réactions disponibles : ${STORY_REACTIONS.join(
              " "
            )}.`,
          },
          400
        );
      }

      await ensureStoriesTables();
      const sql = getDb();
      await sql`
        INSERT INTO vibe_story_reactions (story_id, user_id, emoji)
        VALUES (${id}::uuid, ${userId}, ${emoji})
        ON CONFLICT (story_id, user_id, emoji) DO NOTHING
      `;
      return c.json({ emoji, success: true });
    } catch (err) {
      console.error("[vibe-stories] react error:", err);
      return c.json({ error: "Erreur lors de la réaction." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/stories/:id/react",
      "/vibe/stories/:id/react",
      "/v1/stories/:id/react",
    ],
    handleReactStory
  );

  // ── POST /v1/stories/:id/vote — un vote par compte, modifiable ────────
  const handleVoteStory = async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const id = String(c.req.param("id") || "");
      if (!id) return c.json({ error: "Story introuvable." }, 404);

      await ensureStoriesTables();
      const sql = getDb();

      const body = await c.req.json().catch(() => ({}));
      const index = Number(body?.option_index ?? body?.optionIndex);

      const [story] = await sql`
        SELECT poll FROM vibe_stories
        WHERE id = ${id}::uuid AND deleted_at IS NULL AND expires_at > NOW()
        LIMIT 1
      `;
      const brutPoll = lireJsonb(story?.poll);
      const options = Array.isArray(brutPoll?.options) ? brutPoll.options : [];
      if (options.length === 0) {
        return c.json({ error: "Sondage introuvable." }, 404);
      }
      if (!Number.isInteger(index) || index < 0 || index >= options.length) {
        return c.json({ error: "Option de sondage invalide." }, 400);
      }

      // Un compte, un vote : le rejouer change l'option choisie.
      await sql`
        INSERT INTO vibe_story_poll_votes (story_id, voter_id, option_index)
        VALUES (${id}::uuid, ${userId}, ${index})
        ON CONFLICT (story_id, voter_id)
        DO UPDATE SET option_index = EXCLUDED.option_index, created_at = NOW()
      `;

      const agreges = await sql`
        SELECT option_index, COUNT(*)::int AS votes
        FROM vibe_story_poll_votes
        WHERE story_id = ${id}::uuid
        GROUP BY option_index
      `;
      const counts = options.map((_: any, optionIndex: number) =>
        Number(
          (agreges as any[]).find(
            (ligne: any) => Number(ligne.option_index) === optionIndex
          )?.votes || 0
        )
      );
      return c.json({
        counts,
        myVote: index,
        success: true,
        total: counts.reduce((somme: number, n: number) => somme + n, 0),
      });
    } catch (err) {
      console.error("[vibe-stories] vote error:", err);
      return c.json({ error: "Erreur lors du vote." }, 500);
    }
  };

  registerMulti(
    "post",
    [
      "/api/vibe/stories/:id/vote",
      "/vibe/stories/:id/vote",
      "/v1/stories/:id/vote",
    ],
    handleVoteStory
  );

  // ── GET /v1/stories/:id/views — qui a regardé, auteur seul ───────────
  const handleStoryViews = async (c: any) => {
    try {
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Non authentifié." }, 401);
      const id = String(c.req.param("id") || "");
      if (!id) return c.json({ error: "Story introuvable." }, 404);

      await ensureStoriesTables();
      const sql = getDb();

      // Propriété d'abord, liste ensuite : la liste de qui a regardé est privée,
      // un visiteur non-auteur ne la consulte pas — même s'il a lui-même vu la
      // story, et même s'il existe une ligne de vue à son nom.
      const [proprietaire] = await sql`
        SELECT user_id FROM vibe_stories WHERE id = ${id}::uuid LIMIT 1
      `;
      if (!proprietaire) {
        return c.json({ error: "Story introuvable." }, 404);
      }
      if (Number(proprietaire.user_id) !== userId) {
        return c.json({ error: "Accès refusé." }, 403);
      }

      const lignes = await sql`
        SELECT v.viewed_at, u.username, p.display_name, p.avatar_url
        FROM vibe_story_views v
        JOIN users u ON u.id = v.viewer_id
        LEFT JOIN profiles p ON p.user_id = v.viewer_id
        WHERE v.story_id = ${id}::uuid
        ORDER BY v.viewed_at DESC
        LIMIT 200
      `;

      return c.json({
        count: lignes.length,
        success: true,
        viewers: (lignes as any[]).map((r) => ({
          avatarUrl: r.avatar_url || null,
          displayName: r.display_name || r.username,
          username: r.username,
          viewedAt: r.viewed_at,
        })),
      });
    } catch (err) {
      console.error("[vibe-stories] views error:", err);
      return c.json({ error: "Erreur chargement des vues." }, 500);
    }
  };

  registerMulti(
    "get",
    [
      "/api/vibe/stories/:id/views",
      "/vibe/stories/:id/views",
      "/v1/stories/:id/views",
    ],
    handleStoryViews
  );

  // ── GET /v1/stories/quota — limite et remaining du jour ──────────────
  const handleStoryQuota = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const userId = await storyUserId(c);
      if (!userId) return c.json({ error: "Token invalide." }, 401);

      await ensureStoriesTables();
      const sql = getDb();
      const tier = await resolveStoryTier(userId, token);
      const limit = getTierDailyStoryLimit(tier);
      const dayKey = getStoryDayKey();
      const usage = await sql`
        SELECT stories_created FROM vibe_story_usage_daily
        WHERE user_id = ${userId} AND usage_date = ${dayKey}::date
        LIMIT 1
      `;
      const used = Number(usage[0]?.stories_created || 0);

      return c.json({
        limit,
        remaining: limit === null ? null : Math.max(0, limit - used),
        resetsInMs: getMsUntilStoryReset(),
        tier,
        timeZone: STORY_TIME_ZONE,
        used,
      });
    } catch (err) {
      console.error("[vibe-stories] quota error:", err);
      return c.json({ error: "Erreur chargement du quota." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/stories/quota", "/vibe/stories/quota", "/v1/stories/quota"],
    handleStoryQuota
  );
}
