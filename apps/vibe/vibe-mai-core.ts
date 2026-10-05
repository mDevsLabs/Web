/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI : SOCLE PARTAGÉ (vibe-mai-core.ts)
 * Modèles OpenRouter, formatage des réponses d'outils, contexte de post
 * joint (vision), clé API, persistance des conversations/messages mAI,
 * détection des commandes / et @, et auto-approbation.
 * Scindé de vibe-mai.ts (limite de taille Val Town).
 * ============================================================================
 */

import { getDb, getTierMaiTokenLimit, getWeekData } from "./config.ts";
import { stripHtmlTags } from "./vibe-posts-core.ts";

/** Regex UUID partagée (conversations mAI, publications jointes). */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Modèles "mAI" marketing → modèles OpenRouter réels.
 * Les ids contenant déjà "/" (ex: anthropic/claude-3.7-sonnet) passent tels quels.
 */
const MODEL_MAP: Record<string, string> = {
  "poolside/laguna-xs-2.1:free": "poolside/laguna-xs-2.1:free",
  "mai-1.5-apex": "poolside/laguna-xs-2.1:free",
  "mai-1.5-light": "poolside/laguna-xs-2.1:free",
};

export function _resolveOpenRouterModel(model: string): string {
  if (MODEL_MAP[model]) return MODEL_MAP[model];
  return model.includes("/") ? model : "poolside/laguna-xs-2.1:free";
}

/** Période optionnelle en fin de commande ("/audience 90d", "/hashtags 7j", "... 12m"). */
export function parsePeriodArg(raw: string): "7d" | "30d" | "90d" | "12m" {
  const m = String(raw).toLowerCase().match(/(?:^|\s)(7d|30d|90d|12m|7j|30j|90j|1an|an)\s*$/);
  if (!m) return "30d";
  const v = m[1];
  if (v === "7d" || v === "7j") return "7d";
  if (v === "90d" || v === "90j") return "90d";
  if (v === "12m" || v === "1an" || v === "an") return "12m";
  return "30d";
}

/** Formatte la réponse conversationnelle après exécution d'un outil. */
function formatToolReplyInternal(toolName: string, result: any, _username: string): string {
  if (toolName === "generate_vibe_image") {
    return `🎨 Voici l'image générée avec mAI :\n\n![Image générée](${result.imageUrl})\n\n*Prompt : « ${result.prompt} »*`;
  }
  if (toolName === "search_web") {
    return `🌐 **Recherche Web mAI** :\n\n${result.snippet}`;
  }
  if (toolName === "fact_check") {
    return `🛡️ **Vérification Factuelle mAI** :\n• Affirmation : « ${result.statement} »\n• Résultat : **${result.verdict}** (Indice de confiance : ${result.confidence})\n\n${result.analysis}`;
  }
  if (toolName === "rewrite_post") {
    return `✨ **Texte reformulé (${result.style})** :\n\n${result.rewritten}`;
  }
  if (toolName === "translate") {
    return `🌐 **Traduction (${result.targetLanguage})** :\n\n${result.translated}`;
  }
  if (toolName === "create_post") {
    return `🚀 Votre publication a été publiée avec succès sur Vibe :\n\n« ${result.post.content} »`;
  }
  if (toolName === "delete_post") {
    return `🗑️ ${result.message}`;
  }
  if (toolName === "analyze_trends") {
    const trendsList = result.trendingTopics.map((t: any) => `• **${t.name}** (${t.postsCount} publications) — ${t.sentiment}`).join("\n");
    return trendsList
      ? `🔥 **Tendances actuelles sur Vibe** :\n\n${trendsList}`
      : "🔍 Pas encore de tendances détectées cette semaine. Publiez avec des hashtags pour lancer la vague !";
  }
  if (toolName === "suggest_post") {
    return `💡 **Idées de publications Vibe** (thème : ${result.topic}) :\n\n${result.suggestions}\n\n*Utilisez /publish suivi du texte choisi pour publier.*`;
  }
  if (toolName === "get_account_stats") {
    return `📈 **Statistiques du compte @${result.user.username}** :\n• Publications : **${result.totalPosts}**\n• Score de réputation : **${result.profile?.reputation_score || 100} pts**\n• Forfait : **${result.user.tier || 'Free'}**`;
  }
  if (toolName === "check_quotas") {
    const q = result;
    return `📊 **Vos quotas réels (${q.tier})** :\n• Tokens mAI : **${q.weeklyTokens.used.toLocaleString()}** / ${q.weeklyTokens.limit.toLocaleString()} (${q.weeklyTokens.percent}%)\n• Images quotidiennes : **${q.dailyImages.used}** / ${q.dailyImages.limit} (${q.dailyImages.percent}%)\n• Réinitialisation : ${new Date(q.resetAt).toLocaleDateString("fr-FR")}`;
  }
  if (toolName === "update_profile") {
    return `✅ ${result.message}\n\n• Nom affiché : **${result.profile.display_name}**\n• Bio : ${result.profile.bio || "_(vide)_"}`;
  }
  if (toolName === "follow_user") {
    return `👥 ${result.message}`;
  }
  if (toolName === "get_notifications") {
    if (result.count === 0) return "🔔 Aucune notification récente.";
    const list = result.notifications.slice(0, 10).map((n: any) => `• **${n.type}** — ${n.message || (n.actor_username ? `@${n.actor_username}` : "")}`).join("\n");
    return `🔔 **Vos ${result.count} dernières notifications** :\n\n${list}`;
  }
  if (toolName === "like_post") {
    return result.liked ? `❤️ ${result.message}\n\n• Post : \`${result.post_id}\`\n• Total likes : **${result.likes_count}**` : `🤍 ${result.message}`;
  }
  if (toolName === "send_message") {
    return `💬 ${result.message}\n\n• Destinataire : **@${result.username}**\n• Aperçu : « ${result.preview} »`;
  }
  if (toolName === "update_settings") {
    const keys = Object.keys(result.patched || {}).join(", ");
    return `⚙️ ${result.message}\n\n• Modifiés : \`${keys}\``;
  }
  if (toolName === "bookmark_post") {
    return result.bookmarked ? `🔖 ${result.message}` : `📑 ${result.message}`;
  }
  if (toolName === "repost_post") {
    return result.reposted ? `🔁 ${result.message}` : `↩️ ${result.message}`;
  }
  if (toolName === "comment_post") {
    return `💭 ${result.message}\n\n• Commentaire : \`${result.comment_id}\``;
  }
  if (toolName === "get_post_stats") {
    return `📊 **Analyse du post @${result.author}** :\n• ❤️ ${result.likes} · 🔁 ${result.reposts} · 💬 ${result.replies} · 👁️ ${result.views} · 🔖 ${result.bookmarks}\n• Engagement : **${result.engagement}** (taux ${result.engagement_rate_percent}%)\n\n« ${result.content} »`;
  }
  if (toolName === "search_posts") {
    if (!result.resultsCount) return `🔎 Aucune publication trouvée pour « ${result.query} ».`;
    const list = (result.posts || []).slice(0, 5).map((p: any) => `• @${p.username} — « ${String(p.content || "").replace(/\s+/g, " ").slice(0, 90)} »`).join("\n");
    return `🔎 **${result.resultsCount} publication(s) pour « ${result.query} »** :\n\n${list}`;
  }
  if (toolName === "analyze_creator_stats") {
    const t = result.totals || {};
    const reco = (result.recommendations || []).map((r: string) => `• ${r}`).join("\n");
    return `📈 **Analyse créateur (${result.period_days} j)** :\n• 👁️ Vues : **${t.views ?? "—"}** · ❤️ ${t.likes ?? "—"} · 🔁 ${t.reposts ?? "—"} · 💬 ${t.replies ?? "—"}\n• Taux d'engagement : **${result.engagement_rate_percent ?? "—"}%**${reco ? `\n\n**Recommandations :**\n${reco}` : ""}`;
  }
  if (toolName === "analyze_audience") {
    const src = (result.sources || []).map((s: any) => `• ${s.source} : **${s.views}** vues (${s.percent}%)`).join("\n");
    const hours = (result.peak_hours || []).slice(0, 3).map((h: any) => `${String(h.hour).padStart(2, "0")}h`).join(", ");
    const fans = (result.top_engaged_followers || []).slice(0, 3).map((f: any) => `@${f.username} (${f.views})`).join(", ");
    return `👥 **Audience (${result.period_days} j)** :\n• Vues : **${result.total_views}** · Visiteurs uniques : **${result.unique_viewers}**\n${src}${hours ? `\n• Heures de pointe : ${hours}` : ""}${fans ? `\n• Top followers engagés : ${fans}` : ""}`;
  }
  if (toolName === "best_time_to_post") {
    const slots = (result.best_slots || []).map((s: any) => `• **${s.weekday} ${String(s.hour).padStart(2, "0")}h** — ${s.avg_views} vues moy., ${s.avg_engagement} engagement`).join("\n");
    return `🕐 **Meilleurs créneaux (${result.period_days} j, ${result.analyzed_posts} posts analysés)** :\n${slots || "• Pas assez de données."}\n\n*Confiance : ${result.confidence}*`;
  }
  if (toolName === "compare_periods") {
    const fmt = (label: string, m: any) => `• ${label} : **${m.current}** vs ${m.previous} (${m.delta >= 0 ? "+" : ""}${m.delta}, ${m.percent >= 0 ? "+" : ""}${m.percent}%)`;
    return `📊 **Comparaison (${result.period_days} j vs les ${result.period_days} précédents)** :\n${fmt("Vues", result.views)}\n${fmt("Likes", result.likes)}\n${fmt("Reposts", result.reposts)}\n${fmt("Réponses", result.replies)}\n${fmt("Followers gagnés", result.followers_gained)}\n${fmt("Vues du profil", result.profile_views)}`;
  }
  if (toolName === "predict_post_performance") {
    const tips = (result.breakdown || []).filter((b: any) => b.tip).map((b: any) => `• ${b.tip}`).join("\n");
    return `🎯 **Prévision du brouillon : ${result.score}/100**${result.cold_start ? " (historique insuffisant)" : ""}\n• Portée estimée : **${result.estimated_reach}** vues\n• Engagement estimé : **${result.estimated_engagement}**${tips ? `\n\n**Conseils :**\n${tips}` : ""}`;
  }
  if (toolName === "analyze_content_performance") {
    const formats = (result.formats || []).map((f: any) => `• **${f.format}** : ${f.posts} posts · ${f.avg_views} vues moy. · ${f.avg_engagement} engagement`).join("\n");
    const tags = (result.top_hashtags || []).slice(0, 5).map((t: any) => `${t.tag} (${t.avg_views} vues)`).join(", ");
    return `🧩 **Performance par format (${result.period_days} j)** :\n${formats || "• Aucun post sur la période."}${tags ? `\n\n**Top hashtags :** ${tags}` : ""}`;
  }
  if (toolName === "analyze_dm_activity") {
    const top = (result.top_correspondents || []).slice(0, 3).map((c: any) => `@${c.username} (${c.messages})`).join(", ");
    return `💬 **Activité messages (${result.period_days} j)** :\n• Total : **${result.messages_total}** (${result.sent} envoyés, ${result.received} reçus)\n• Conversations actives : **${result.active_conversations}** · Groupes : ${result.groups}${result.avg_reply_minutes !== null ? `\n• Temps de réponse moyen : **${result.avg_reply_minutes} min**` : ""}${top ? `\n• Top correspondants : ${top}` : ""}`;
  }
  if (toolName === "analyze_book_stats") {
    const books = (result.books || []).map((b: any) => `• **${b.title}** : ${b.items_count} Vibes · ${b.members_count} membres · ${b.contributors_count} contributeurs`).join("\n");
    return `📚 **Vos Livres (${result.books_count})** :\n${books || "• Aucun Livre."}`;
  }
  if (toolName === "analyze_hashtags") {
    const tags = (result.hashtags || []).slice(0, 5).map((t: any) => `• **${t.tag}** — ${t.avg_views} vues moy., ${t.avg_likes} likes moy.`).join("\n");
    const sugg = (result.suggestions || []).slice(0, 4).map((t: any) => `${t.tag} (${t.platform_posts_7d})`).join(", ");
    return `#️⃣ **Hashtags (${result.period_days} j)** :\n${tags || "• Aucun hashtag utilisé sur la période."}${sugg ? `\n\n**Suggestions tendance :** ${sugg}` : ""}`;
  }
  return "✅ Action effectuée.";
}

/** Limite la taille des chips/réponses et évite qu'un résultat malveillant
 * transforme une réponse mAI en réponse géante. */
export function formatToolReply(toolName: string, result: any, _username: string): string {
  try {
    const bounded = boundPersistedValue(result || {}, 24_000);
    return formatToolReplyInternal(toolName, bounded, _username).slice(0, 12_000);
  } catch {
    return "✅ Action effectuée, mais le détail de l'outil a été tronqué.";
  }
}

// ── Contexte de post joint à une question mAI ────────────────────────────
// Le post est transmis avec ses statistiques, ses premiers commentaires et
// ses médias. Les images sont jointes comme FICHIERS (octets récupérés puis
// encodés en base64 data-URL), jamais comme simples URLs.
export const VISION_CAPABLE_MODELS = new Set([
  "openai/gpt-4o",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "anthropic/claude-3.7-sonnet",
  "mai-1.5-apex",
]);

/** Limites de contexte et de sécurité pour les médias joints. */
export const MAX_CONTEXT_POST_CHARS = 4_000;
export const MAX_CONTEXT_COMMENT_CHARS = 200;
export const MAX_CONTEXT_MEDIA_URL_LENGTH = 2_048;
const MAX_CONTEXT_IMAGES = 3;
const MAX_CONTEXT_IMAGE_BYTES = 3.5 * 1024 * 1024;
const MAX_CONTEXT_TOTAL_IMAGE_BYTES = 7 * 1024 * 1024;
const MAX_REMOTE_MEDIA_REDIRECTS = 2;
const REMOTE_MEDIA_TIMEOUT_MS = 8_000;

/**
 * Nom réservé transporté dans les arguments d'un outil en attente. Il permet
 * au client historique de renvoyer automatiquement le nonce sans modifier son
 * contrat (y compris l'UI) ; il est retiré avant toute exécution.
 */
export const APPROVAL_NONCE_ARG = "__mai_approval_nonce";

const PRIVATE_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

function stripIpv6Zone(address: string): string {
  return address.split("%")[0].toLowerCase();
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const value = stripIpv6Zone(address);
  if (!value.includes(":")) return false;
  if (value === "::1" || value === "::") return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.).
  const mapped = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped && isPrivateIpv4(mapped[1])) return true;

  const first = value.split(":")[0];
  if (/^f[cd][0-9a-f]{0,2}$/.test(first)) return true; // fc00::/7
  if (/^fe[89ab][0-9a-f]?$/.test(first)) return true; // fe80::/10
  if (value.startsWith("ff")) return true; // multicast
  if (value.startsWith("2001:db8")) return true; // documentation range
  return false;
}

function isPrivateAddress(address: string): boolean {
  const value = stripIpv6Zone(String(address || "").trim());
  return value.includes(":") ? isPrivateIpv6(value) : isPrivateIpv4(value);
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  if (PRIVATE_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (/^\d+(?:\.\d+){3}$/.test(host)) return isPrivateIpv4(host);
  // URL normalise normalement les notations IPv4, mais on refuse aussi les
  // variantes décimales/hexadécimales qui peuvent contourner un filtre naïf.
  if (/^\d+$/.test(host)) {
    const numeric = Number(host);
    if (Number.isSafeInteger(numeric)) {
      const octets = [24, 16, 8, 0].map((shift) => Math.floor(numeric / (2 ** shift)) & 255);
      return isPrivateIpv4(octets.join("."));
    }
  }
  if (/^0x[0-9a-f]+$/i.test(host)) return true;
  if (host.includes(":")) return isPrivateIpv6(host);
  return false;
}

async function resolveRemoteAddresses(hostname: string): Promise<string[] | null> {
  const host = hostname.replace(/\.$/, "");
  const dnsTimeout = (promise: Promise<any>): Promise<any> => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Résolution DNS trop lente.")), 3_000);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
  const deno = (globalThis as any).Deno;
  if (deno?.resolveDns) {
    const answers = await dnsTimeout(Promise.all([
      deno.resolveDns(host, "A").catch(() => []),
      deno.resolveDns(host, "AAAA").catch(() => []),
    ]));
    return answers.flat().map((entry: any) => String(entry)).filter(Boolean);
  }
  try {
    // Import dynamique : le runtime Deno/Val Town n'a pas besoin de charger le
    // module DNS natif lorsque Deno.resolveDns est disponible.
    const dns: any = await import("node:dns/promises");
    const answers = await dnsTimeout(dns.lookup(host, { all: true, verbatim: true }));
    return answers.map((entry: any) => String(entry?.address || "")).filter(Boolean);
  } catch (err) {
    // En l'absence du module natif (runtime web), l'appelant peut encore
    // valider les IP littérales ; une erreur de résolution effective reste
    // fail-closed pour éviter un fetch aveugle.
    const errorMessage = String((err as any)?.message || "");
    if (errorMessage.includes("Cannot find")) return null;
    if (errorMessage.includes("DNS")) throw err;
    return null;
  }
}

export async function validateRemoteMediaUrl(raw: unknown): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: "L'URL du média est requise." };
  const value = raw.trim();
  if (value.length > MAX_CONTEXT_MEDIA_URL_LENGTH) return { ok: false, error: "L'URL du média est trop longue." };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: "L'URL du média est invalide." };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Seules les URL HTTP(S) sont autorisées pour un média." };
  }
  if (parsed.username || parsed.password) return { ok: false, error: "Les identifiants dans une URL média sont interdits." };
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    return { ok: false, error: "Le port du média n'est pas autorisé." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!hostname || isPrivateHostname(hostname)) {
    return { ok: false, error: "Les hôtes locaux, privés et metadata sont interdits." };
  }

  let addresses: string[] | null = null;
  try {
    addresses = await resolveRemoteAddresses(hostname);
  } catch {
    return { ok: false, error: "Impossible de vérifier l'adresse du média." };
  }
  if (addresses && (addresses.length === 0 || addresses.some((address) => isPrivateAddress(address)))) {
    return { ok: false, error: "L'URL du média pointe vers une adresse réseau privée ou non vérifiable." };
  }
  const canonical = parsed.toString();
  if (canonical.length > MAX_CONTEXT_MEDIA_URL_LENGTH) return { ok: false, error: "L'URL du média est trop longue." };
  return { ok: true, url: canonical };
}

async function readResponseBodyLimited(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  const contentLength = Number(response.headers?.get?.("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  if (!response.body) {
    if (typeof (response as any).arrayBuffer !== "function" && typeof (response as any).text === "function") {
      const text = String(await (response as any).text());
      if (!text || text.length > maxBytes) return null;
      return new TextEncoder().encode(text);
    }
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > 0 && buffer.byteLength <= maxBytes ? new Uint8Array(buffer) : null;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = next.value instanceof Uint8Array ? next.value : new Uint8Array(next.value);
      total += chunk.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(chunk);
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  if (total === 0) return null;
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export async function readJSONResponseLimited(response: Response, maxBytes = 1_000_000): Promise<any> {
  const bytes = await readResponseBodyLimited(response, maxBytes);
  if (!bytes) return null;
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

async function fetchPublicImage(rawUrl: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  let current: URL;
  const initial = await validateRemoteMediaUrl(rawUrl);
  if (!initial.ok) return null;
  try { current = new URL(initial.url); } catch { return null; }

  for (let redirect = 0; redirect <= MAX_REMOTE_MEDIA_REDIRECTS; redirect++) {
    const checked = await validateRemoteMediaUrl(current.toString());
    if (!checked.ok) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOTE_MEDIA_TIMEOUT_MS);
    try {
      const response = await fetch(checked.url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: "image/*" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers?.get?.("location");
        if (!location || redirect === MAX_REMOTE_MEDIA_REDIRECTS) return null;
        const next = new URL(location, current);
        const validNext = await validateRemoteMediaUrl(next.toString());
        if (!validNext.ok) return null;
        current = next;
        continue;
      }
      if (!response.ok) return null;
      const contentType = (response.headers?.get?.("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!/^image\/[a-z0-9.+-]+$/.test(contentType) || contentType === "image/svg+xml") return null;
      const bytes = await readResponseBodyLimited(response, MAX_CONTEXT_IMAGE_BYTES);
      return bytes ? { bytes, contentType } : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as any);
  }
  return btoa(binary);
}

/**
 * Un post n'est inclus dans un contexte IA que si son audience et son statut
 * sont visibles pour le demandeur. Les posts propres restent accessibles à leur
 * auteur ; les posts planifiés ne sont jamais exposés à un tiers.
 */
export async function canUserViewPost(sql: any, post: any, viewerId?: number | null): Promise<boolean> {
  const viewer = Number.isSafeInteger(Number(viewerId)) && Number(viewerId) > 0 ? Number(viewerId) : null;
  const authorId = Number(post?.author_id);
  const status = String(post?.status || "published").toLowerCase();
  const visibility = String(post?.visibility || "public").toLowerCase();
  if (viewer && authorId === viewer) return true;
  if (viewer) {
    try {
      const blocked = await sql`
        SELECT 1 FROM blocked_users
        WHERE (user_id = ${viewer} AND blocked_user_id = ${authorId})
           OR (user_id = ${authorId} AND blocked_user_id = ${viewer})
        LIMIT 1
      `;
      if (blocked.length > 0) return false;
    } catch {
      return false;
    }
  }
  if (status !== "published") return false;
  if (visibility === "public") return true;
  if (!viewer || visibility === "private") return false;
  try {
    if (visibility === "followers") {
      const rows = await sql`
        SELECT 1 FROM follows
        WHERE follower_id = ${viewer} AND following_id = ${authorId}
        LIMIT 1
      `;
      return rows.length > 0;
    }
    if (visibility === "circle") {
      const rows = await sql`
        SELECT 1 FROM circle_members
        WHERE user_id = ${authorId} AND member_user_id = ${viewer}
        LIMIT 1
      `;
      return rows.length > 0;
    }
  } catch {
    return false;
  }
  return false;
}

export async function buildPostContext(
  sql: any,
  postId: string,
  viewerId?: number | null
): Promise<{ text: string; imageParts: any[] } | null> {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(postId || ""))) return null;

    const rows = await sql`
      SELECT p.id, p.author_id, p.content, p.visibility,
             COALESCE(p.status, 'published') AS status,
             p.likes_count, p.reposts_count, p.replies_count, p.views_count,
             p.published_at, p.created_via, p.ai_generated,
             u.username, pr.display_name
      FROM posts p
      JOIN users u ON u.id = p.author_id
      LEFT JOIN profiles pr ON pr.user_id = u.id
      WHERE p.id = ${String(postId)}::uuid
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const post = rows[0];
    if (!(await canUserViewPost(sql, post, viewerId))) return null;

    let commentsText = "";
    try {
      const comments = await sql`
        SELECT c.content, u.username
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ${String(postId)}::uuid AND c.is_hidden = FALSE
        ORDER BY c.depth ASC, c.likes_count DESC, c.created_at ASC
        LIMIT 10
      `;
      if (comments.length > 0) {
        const lines = comments
          .map((cm: any) => `  • @${String(cm.username || "").slice(0, 80)} : ${String(cm.content || "").slice(0, MAX_CONTEXT_COMMENT_CHARS)}`)
          .join("\n");
        commentsText = `\n\nPremiers commentaires :\n${lines}`;
      }
    } catch {}

    let media: any[] = [];
    try {
      media = await sql`
        SELECT url, media_type FROM media_assets
        WHERE post_id = ${String(postId)}::uuid
        ORDER BY id ASC LIMIT 20
      `;
    } catch {}

    const publishedAt = post.published_at ? new Date(post.published_at) : null;
    const dateText = publishedAt && !Number.isNaN(publishedAt.getTime())
      ? publishedAt.toLocaleString("fr-FR")
      : "date non publiée";
    const contentText = String(post.content || "").slice(0, MAX_CONTEXT_POST_CHARS);
    const text =
      `📌 Post mentionné de @${String(post.username || "").slice(0, 80)} (${String(post.display_name || post.username || "").slice(0, 100)})` +
      `${post.ai_generated ? " [marqué « créé avec l'IA » par son auteur]" : ""}\n` +
      `Publié le ${dateText}\n\n` +
      `« ${contentText} »\n\n` +
      `Statistiques : ${Number(post.likes_count || 0)} J'aime · ${Number(post.replies_count || 0)} réponses · ${Number(post.reposts_count || 0)} republications · ${Number(post.views_count || 0)} vues` +
      commentsText;

    const imageParts: any[] = [];
    let totalImageBytes = 0;
    for (const m of media) {
      if (imageParts.length >= MAX_CONTEXT_IMAGES || totalImageBytes >= MAX_CONTEXT_TOTAL_IMAGE_BYTES) break;
      const url = String(m.url || "");
      const isImage =
        String(m.media_type || "").startsWith("image") ||
        /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
      if (!url || url.length > MAX_CONTEXT_MEDIA_URL_LENGTH || !isImage) continue;
      const image = await fetchPublicImage(url);
      if (!image || totalImageBytes + image.bytes.byteLength > MAX_CONTEXT_TOTAL_IMAGE_BYTES) continue;
      totalImageBytes += image.bytes.byteLength;
      imageParts.push({
        type: "image_url",
        image_url: { url: `data:${image.contentType};base64,${bytesToBase64(image.bytes)}` },
      });
    }

    return { text, imageParts };
  } catch (err) {
    console.warn("[mAI Chat] buildPostContext:", (err as any)?.message);
    return null;
  }
}

/** Clé OpenRouter : variable d'environnement, sinon clé personnelle de l'utilisateur. */
export async function getOpenRouterKey(sql: any, userId: number): Promise<string> {
  const keyRows = await sql`
    SELECT api_key FROM mprojects_api_keys WHERE user_id::text = ${userId}::text LIMIT 1
  `.catch(() => []);
  return (
    (typeof (globalThis as any).Deno !== "undefined" && (globalThis as any).Deno.env?.get("OPENROUTER_API_KEY")) ||
    (typeof process !== "undefined" && process.env?.OPENROUTER_API_KEY) ||
    (keyRows.length > 0 ? keyRows[0].api_key : "")
  );
}

// ── Persistance des conversations mAI (tables migration 002, créées
//    idempotemment au démarrage : le migrateur n'exécute pas les SQL) ──
let maiTablesReady = false;
export async function ensureMAIConversations() {
  if (maiTablesReady) return;
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS mai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Nouvelle discussion mAI',
        model_id VARCHAR(100) DEFAULT 'mai-1.5-apex',
        system_prompt TEXT,
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS mai_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES mai_conversations(id) ON DELETE CASCADE,
        sender_role VARCHAR(20) NOT NULL,
        content TEXT,
        tool_calls JSONB,
        tool_call_id VARCHAR(100),
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // Multi-conversations + chips d'outils : colonnes défensives et index
    await sql`ALTER TABLE mai_messages ADD COLUMN IF NOT EXISTS tool_calls JSONB`.catch(() => {});
    await sql`ALTER TABLE mai_messages ADD COLUMN IF NOT EXISTS tool_call_id VARCHAR(100)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_mai_messages_conv ON mai_messages(conversation_id, created_at DESC)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_mai_conversations_user ON mai_conversations(user_id, updated_at DESC)`.catch(() => {});
    maiTablesReady = true;
  } catch (err) {
    console.warn("[vibe-mai] ensureMAIConversations skipped:", (err as any)?.message);
  }
}

/** Conversation active de l'utilisateur : la plus récente, créée au besoin. */
export async function getOrCreateConversation(sql: any, userId: number) {
  const existing = await sql`
    SELECT id FROM mai_conversations WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 1
  `.catch(() => []);
  if (existing.length > 0) return existing[0].id as string;
  const created = await sql`
    INSERT INTO mai_conversations (user_id, title) VALUES (${userId}, 'Discussion mAI') RETURNING id
  `.catch(() => []);
  return created[0]?.id as string | undefined;
}

/** Conversation demandée par le client : validée propriétaire, ou signalée invalide. */
export async function resolveOwnedConversation(sql: any, userId: number, raw: unknown): Promise<{ id: string | null; invalid: boolean }> {
  const rawId = typeof raw === "string" ? raw.trim() : "";
  if (!rawId) return { id: null, invalid: false };
  if (!UUID_RE.test(rawId)) return { id: null, invalid: true };
  const rows = await sql`
    SELECT id FROM mai_conversations WHERE id = ${rawId}::uuid AND user_id = ${userId} LIMIT 1
  `.catch(() => []);
  return rows.length > 0 ? { id: String(rows[0].id), invalid: false } : { id: null, invalid: true };
}

/** Titre automatique depuis le premier message utilisateur (titre par défaut seulement). */
export async function maybeAutoTitleConversation(sql: any, conversationId: string, firstMessage: string) {
  try {
    const rows = await sql`SELECT title FROM mai_conversations WHERE id = ${conversationId}::uuid LIMIT 1`;
    const current = String(rows[0]?.title || "").trim();
    if (current && current !== "Discussion mAI" && current !== "Nouvelle discussion mAI") return;
    const plain = stripHtmlTags(String(firstMessage)).replace(/\s+/g, " ").trim();
    if (!plain) return;
    const title = plain.length > 60 ? `${plain.slice(0, 57)}…` : plain;
    await sql`UPDATE mai_conversations SET title = ${title} WHERE id = ${conversationId}::uuid`;
  } catch {}
}

/** Insère un message mAI et met à jour l'horodatage de la conversation. */
export async function saveMAIMessage(
  sql: any,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  extra?: { toolCalls?: any[] | null; toolCallId?: string | null }
) {
  try {
    const safeCalls = extra?.toolCalls && extra.toolCalls.length > 0
      ? extra.toolCalls.slice(0, 10).map((call: any) => ({
          ...call,
          args: boundPersistedValue(call?.args, 8_000),
          result: boundPersistedValue(call?.result, 16_000),
          error: call?.error ? String(call.error).slice(0, 500) : call?.error ?? null,
        }))
      : null;
    const toolCallsJson = safeCalls ? JSON.stringify(safeCalls) : null;
    const safeContent = String(content ?? "").slice(0, 20_000);
    const rows = await sql`
      INSERT INTO mai_messages (conversation_id, sender_role, content, tool_calls, tool_call_id)
      VALUES (${conversationId}::uuid, ${role}, ${safeContent}, ${toolCallsJson}::jsonb, ${extra?.toolCallId || null})
      RETURNING id, created_at
    `;
    await sql`UPDATE mai_conversations SET updated_at = NOW() WHERE id = ${conversationId}::uuid`;
    return rows[0] || null;
  } catch (err) {
    console.warn("[vibe-mai] saveMAIMessage:", (err as any)?.message);
    return null;
  }
}

/** Enregistre d'un appel d'outil (persisté dans mai_messages.tool_calls). */
export function makeToolCallRecord(opts: {
  name: string;
  args?: any;
  status: "executed" | "error" | "pending_approval" | "rejected" | "disabled" | "blocked" | "executing";
  result?: any;
  error?: string | null;
  model?: string | null;
  approvalNonce?: string | null;
}) {
  return {
    id: (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: opts.name,
    args: opts.args || {},
    status: opts.status,
    result: opts.result ?? null,
    error: opts.error ?? null,
    model: opts.model ?? null,
    ...(opts.approvalNonce ? { approvalNonce: opts.approvalNonce } : {}),
    at: new Date().toISOString(),
  };
}

function boundPersistedValue(value: any, maxChars: number): any {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return null;
    if (serialized.length <= maxChars) return value;
    return { truncated: true, preview: serialized.slice(0, maxChars) };
  } catch {
    return { unavailable: true };
  }
}

function cloneToolValue(value: any, depth = 0): any {
  if (depth > 8) throw new Error("Arguments d'outil trop imbriqués.");
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 20_000) throw new Error("Un argument d'outil est trop long.");
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (value.length > 50) throw new Error("Trop d'éléments dans les arguments d'outil.");
    return value.slice(0, 50).map((item) => cloneToolValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, any> = {};
    const keys = Object.keys(value).slice(0, 100);
    for (const key of keys) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      output[key] = cloneToolValue(value[key], depth + 1);
    }
    return output;
  }
  throw new Error("Type d'argument d'outil non autorisé.");
}

/** Valide et clone les arguments JSON avant persistance/exécution. */
export function sanitizeToolArgs(raw: unknown): Record<string, any> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error("Les arguments d'outil doivent être un objet JSON.");
  const cloned = cloneToolValue(raw) as Record<string, any>;
  let serialized: string;
  try {
    serialized = JSON.stringify(cloned);
  } catch {
    throw new Error("Arguments d'outil invalides.");
  }
  if (serialized.length > 32_768) throw new Error("Arguments d'outil trop volumineux.");
  return JSON.parse(serialized);
}

/** Retire le nonce transporté dans args et retourne une copie sans secret. */
export function extractApprovalNonce(
  rawArgs: unknown,
  explicitNonce?: unknown
): { args: Record<string, any>; nonce: string | null } {
  const args = sanitizeToolArgs(rawArgs);
  const embedded = args[APPROVAL_NONCE_ARG];
  delete args[APPROVAL_NONCE_ARG];
  const candidate = explicitNonce !== undefined && explicitNonce !== null ? explicitNonce : embedded;
  const nonce = typeof candidate === "string" && /^[A-Za-z0-9_-]{8,200}$/.test(candidate) ? candidate : null;
  return { args, nonce };
}

export function createApprovalNonce(): string {
  const cryptoObj: any = (globalThis as any).crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID().replace(/-/g, "");
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(24);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  throw new Error("Générateur de nonce cryptographique indisponible.");
}

function canonicalToolValue(value: any): any {
  if (Array.isArray(value)) return value.map(canonicalToolValue);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((out: Record<string, any>, key) => {
      if (value[key] !== undefined) out[key] = canonicalToolValue(value[key]);
      return out;
    }, {});
  }
  return value;
}

export function toolArgsEqual(left: unknown, right: unknown): boolean {
  try {
    return JSON.stringify(canonicalToolValue(left)) === JSON.stringify(canonicalToolValue(right));
  } catch {
    return false;
  }
}

/** Retrouve un appel en attente sans faire confiance à `approve=true`. */
export async function findPendingToolMessage(
  sql: any,
  conversationId: string,
  toolName: string,
  args: Record<string, any>,
  approvalNonce?: string | null
): Promise<{ id: string; call: any } | null> {
  try {
    const rows = await sql`
      SELECT id, tool_calls FROM mai_messages
      WHERE conversation_id = ${String(conversationId)}::uuid
        AND sender_role = 'assistant' AND tool_calls IS NOT NULL
      ORDER BY created_at DESC LIMIT 40
    `;
    for (const row of rows as any[]) {
      const calls = Array.isArray(row.tool_calls) ? row.tool_calls : [];
      for (const call of calls) {
        if (!call || call.name !== toolName || call.status !== "pending_approval") continue;
        if (approvalNonce && call.approvalNonce !== approvalNonce) continue;
        if (!toolArgsEqual(call.args || {}, args)) continue;
        return { id: String(row.id), call };
      }
    }
  } catch (err) {
    console.warn("[vibe-mai] findPendingToolMessage:", (err as any)?.message);
  }
  return null;
}

/** Réclame atomiquement une approbation pour empêcher une double exécution. */
export async function claimPendingToolMessage(
  sql: any,
  conversationId: string,
  toolName: string,
  args: Record<string, any>,
  approvalNonce: string
): Promise<{ id: string; call: any } | null> {
  if (!approvalNonce) return null;
  try {
    const rows = await sql`
      SELECT id, tool_calls FROM mai_messages
      WHERE conversation_id = ${String(conversationId)}::uuid
        AND sender_role = 'assistant' AND tool_calls IS NOT NULL
      ORDER BY created_at DESC LIMIT 40
    `;
    for (const row of rows as any[]) {
      const calls = Array.isArray(row.tool_calls) ? row.tool_calls : [];
      const idx = calls.findIndex((cc: any) =>
        cc && cc.name === toolName && cc.status === "pending_approval" &&
        cc.approvalNonce === approvalNonce && toolArgsEqual(cc.args || {}, args)
      );
      if (idx < 0) continue;
      const nextCalls = calls.slice();
      nextCalls[idx] = { ...calls[idx], status: "executing", at: new Date().toISOString() };
      const updated = await sql`
        UPDATE mai_messages SET tool_calls = ${JSON.stringify(nextCalls)}::jsonb
        WHERE id = ${String(row.id)}::uuid AND tool_calls = ${JSON.stringify(row.tool_calls)}::jsonb
        RETURNING id
      `;
      if (updated.length > 0) return { id: String(row.id), call: nextCalls[idx] };
    }
  } catch (err) {
    console.warn("[vibe-mai] claimPendingToolMessage:", (err as any)?.message);
  }
  return null;
}

/**
 * Finalise le dernier message assistant portant un record `pending_approval`
 * pour cet outil (exécution ou refus) : met à jour contenu + tool_calls sans
 * insérer de doublon. Les arguments et le nonce doivent correspondre.
 */
export async function finalizePendingToolMessage(
  sql: any,
  conversationId: string,
  toolName: string,
  patch: { status: string; result?: any; error?: string | null; reply: string; model?: string | null },
  approvalNonce?: string | null,
  args?: Record<string, any>
): Promise<{ id: string | null }> {
  try {
    const rows = await sql`
      SELECT id, tool_calls FROM mai_messages
      WHERE conversation_id = ${String(conversationId)}::uuid AND sender_role = 'assistant' AND tool_calls IS NOT NULL
      ORDER BY created_at DESC LIMIT 40
    `;
    for (const row of rows as any[]) {
      const calls = Array.isArray(row.tool_calls) ? row.tool_calls : [];
      const idx = calls.findIndex((cc: any) => {
        const eligibleStatus = patch.status === "rejected"
          ? cc?.status === "pending_approval"
          : (cc?.status === "pending_approval" || cc?.status === "executing");
        if (!cc || cc.name !== toolName || !eligibleStatus) return false;
        if (approvalNonce && cc.approvalNonce !== approvalNonce) return false;
        if (args && !toolArgsEqual(cc.args || {}, args)) return false;
        return true;
      });
      if (idx >= 0) {
        calls[idx] = {
          ...calls[idx],
          status: patch.status,
          result: boundPersistedValue(patch.result, 16_000),
          error: patch.error ? String(patch.error).slice(0, 500) : patch.error ?? null,
          model: patch.model ?? calls[idx].model ?? null,
          at: new Date().toISOString(),
        };
        const updated = await sql`
          UPDATE mai_messages SET content = ${String(patch.reply || "").slice(0, 12_000)}, tool_calls = ${JSON.stringify(calls)}::jsonb
          WHERE id = ${String(row.id)}::uuid
            AND tool_calls = ${JSON.stringify(row.tool_calls)}::jsonb
          RETURNING id
        `;
        if (updated.length > 0) return { id: String(row.id) };
      }
    }
  } catch (err) {
    console.warn("[vibe-mai] finalizePendingToolMessage:", (err as any)?.message);
  }
  return { id: null };
}

// Détection d'outils par commandes / ou mentions @
export function detectTool(cleanMsg: string): { toolToRun: string; toolArgs: any } | null {
  const lower = cleanMsg.toLowerCase();
  if (lower.startsWith("/image") || lower.startsWith("@image") || lower.startsWith("/draw") || lower.startsWith("@draw") || lower.startsWith("@generate_image") || lower.startsWith("génère une image")) {
    const prompt = cleanMsg.replace(/^([/@](image|draw|generate_image)|(génère|crée)\s*(une image|l'image)?)\s*:?\s*/i, "").trim();
    return { toolToRun: "generate_vibe_image", toolArgs: { prompt: prompt || "Création artistique numérique minimaliste" } };
  }
  if (lower.startsWith("/search") || lower.startsWith("@search") || lower.startsWith("/recherche") || lower.startsWith("@recherche") || lower.startsWith("@web")) {
    const q = cleanMsg.replace(/^[/@](search|recherche|web)\s*:?\s*/i, "").trim();
    return { toolToRun: "search_web", toolArgs: { query: q || "Intelligence artificielle 2026" } };
  }
  if (lower.startsWith("/fact_check") || lower.startsWith("@fact_check") || lower.startsWith("/verifier") || lower.startsWith("@verifier")) {
    const s = cleanMsg.replace(/^[/@](fact_check|verifier)\s*:?\s*/i, "").trim();
    return { toolToRun: "fact_check", toolArgs: { statement: s || cleanMsg } };
  }
  if (lower.startsWith("/rewrite") || lower.startsWith("@rewrite") || lower.startsWith("/reformuler") || lower.startsWith("@reformuler") || lower.startsWith("@style")) {
    const words = cleanMsg.replace(/^[/@](rewrite|reformuler|style)\s*:?\s*/i, "").trim().split(/\s+/);
    const style = ["viral", "pro", "humour", "concis", "poétique"].includes(words[0]?.toLowerCase()) ? words.shift() : "viral";
    return { toolToRun: "rewrite_post", toolArgs: { text: words.join(" ") || cleanMsg, style } };
  }
  if (lower.startsWith("/translate") || lower.startsWith("@translate") || lower.startsWith("/traduire") || lower.startsWith("@traduire")) {
    const words = cleanMsg.replace(/^[/@](translate|traduire)\s*:?\s*/i, "").trim().split(/\s+/);
    const lang = words[0] || "anglais";
    words.shift();
    return { toolToRun: "translate", toolArgs: { text: words.join(" ") || cleanMsg, target_language: lang } };
  }
  if (lower.startsWith("/publish") || lower.startsWith("@publish") || lower.startsWith("/publier") || lower.startsWith("@publier") || lower.startsWith("@post") || lower.startsWith("publie ")) {
    const textMatch = cleanMsg.replace(/^([/@](publish|publier|post)|(publie|poste))\s*:?\s*/i, "").trim();
    return { toolToRun: "create_post", toolArgs: { content: textMatch || cleanMsg } };
  }
  if (lower.startsWith("/delete_post") || lower.startsWith("@delete_post") || lower.startsWith("/supprimer")) {
    const raw = cleanMsg.replace(/^[/@](delete_post|supprimer)\s*:?\s*/i, "").trim();
    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return { toolToRun: "delete_post", toolArgs: { post_id: m[0] } };
    return null;
  }
  if (lower.startsWith("/find") || lower.startsWith("@find") || lower.includes("cherche des posts") || lower.includes("recherche des posts")) {
    const q = cleanMsg.replace(/^[/@]find\s*:?\s*/i, "").trim();
    return { toolToRun: "search_posts", toolArgs: { query: q || cleanMsg } };
  }
  if (lower.startsWith("/profile") || lower.startsWith("@profile") || lower.includes("modifie mon profil") || lower.includes("change ma bio")) {
    const raw = cleanMsg.replace(/^[/@]profile\s*:?\s*/i, "").trim();
    // Format : /profile display_name: X bio: Y (approbation requise côté chat)
    const dn = raw.match(/display_name\s*:\s*([^,;]+)/i);
    const bio = raw.match(/bio\s*:\s*([\s\S]+)/i);
    const args: Record<string, string> = {};
    if (dn) args.display_name = dn[1].trim();
    if (bio) args.bio = bio[1].trim();
    if (args.display_name || args.bio) return { toolToRun: "update_profile", toolArgs: args };
    return null;
  }
  if (lower.startsWith("/follow") || lower.startsWith("@follow") || lower.startsWith("/suivre") || lower.startsWith("@suivre")) {
    const target = cleanMsg.replace(/^[/@](follow|suivre)\s*:?\s*/i, "").trim().replace(/^@/, "");
    if (target) return { toolToRun: "follow_user", toolArgs: { username: target } };
  }
  if (lower.startsWith("/trends") || lower.startsWith("@trends") || lower.startsWith("/tendances") || lower.startsWith("@tendances")) {
    return { toolToRun: "analyze_trends", toolArgs: {} };
  }
  // ── Outils d'analyse avancée ─────────────────────────────────────────────
  // Blocs placés AVANT /dm et /analyze : leurs préfixes (/dmstats, /analyze_stats)
  // commencent par /dm et /analyze et seraient capturés par les blocs plus bas.
  if (lower.startsWith("/analyze_stats") || lower.startsWith("@analyze_stats") || lower.includes("analyse mes stats") || lower.includes("mes statistiques créateur")) {
    return { toolToRun: "analyze_creator_stats", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/audience") || lower.startsWith("@audience") || lower.includes("mon audience") || lower.includes("qui me regarde")) {
    return { toolToRun: "analyze_audience", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/besttime") || lower.startsWith("@besttime") || lower.includes("meilleur moment") || lower.includes("quand publier")) {
    return { toolToRun: "best_time_to_post", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/compare") || lower.startsWith("@compare") || lower.includes("compare mes") || lower.includes("vs la période")) {
    return { toolToRun: "compare_periods", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/predict") || lower.startsWith("@predict") || lower.includes("prédis") || lower.includes("prévision")) {
    const content = cleanMsg.replace(/^[/@]predict\s*:?\s*/i, "").trim();
    return { toolToRun: "predict_post_performance", toolArgs: { content: content || cleanMsg } };
  }
  if (lower.startsWith("/formats") || lower.startsWith("@formats") || lower.includes("mes formats") || lower.includes("performance par format")) {
    return { toolToRun: "analyze_content_performance", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/dmstats") || lower.startsWith("@dmstats") || lower.includes("activité de messagerie")) {
    return { toolToRun: "analyze_dm_activity", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/bookstats") || lower.startsWith("@bookstats") || lower.includes("stats de mes livres")) {
    return { toolToRun: "analyze_book_stats", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/hashtags") || lower.startsWith("@hashtags") || lower.includes("mes hashtags")) {
    return { toolToRun: "analyze_hashtags", toolArgs: { period: parsePeriodArg(cleanMsg) } };
  }
  if (lower.startsWith("/inspire") || lower.startsWith("@inspire") || lower.startsWith("/idee") || lower.startsWith("@idee") || lower.startsWith("/idée")) {
    const topic = cleanMsg.replace(/^[/@](inspire|idee|idée)(-?moi)?\s*(sur|à propos de|about)?\s*:?\s*/i, "").trim();
    return { toolToRun: "suggest_post", toolArgs: { topic: topic || "sujets d'actualité", style: "viral" } };
  }
  if (lower.startsWith("/stats") || lower.startsWith("@stats") || lower.startsWith("/compte") || lower.startsWith("@compte") || lower.includes("mes stats") || lower.includes("mon compte")) {
    return { toolToRun: "get_account_stats", toolArgs: {} };
  }
  if (lower.startsWith("/quotas") || lower.startsWith("@quotas") || lower.startsWith("/limites") || lower.includes("mes quotas") || lower.includes("mes limites")) {
    return { toolToRun: "check_quotas", toolArgs: {} };
  }
  if (lower.startsWith("/notifications") || lower.startsWith("@notifications") || lower.startsWith("/notifs") || lower.startsWith("@notifs")) {
    return { toolToRun: "get_notifications", toolArgs: {} };
  }
  if (lower.startsWith("/like") || lower.startsWith("@like") || lower.startsWith("/liker") || lower.startsWith("@liker") || lower.startsWith("/unlike") || lower.startsWith("@unlike")) {
    const isUnlike = lower.startsWith("/unlike") || lower.startsWith("@unlike");
    const raw = cleanMsg.replace(/^[/@](like|liker|unlike)\s*:?\s*/i, "").trim();
    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return { toolToRun: "like_post", toolArgs: { post_id: m[0], like: !isUnlike } };
    if (raw) return { toolToRun: "like_post", toolArgs: { post_id: raw.split(/\s+/)[0], like: !isUnlike } };
    return null;
  }
  if (lower.startsWith("/dm") || lower.startsWith("@dm") || lower.startsWith("/message") || lower.startsWith("@message") || lower.startsWith("/envoyer")) {
    const raw = cleanMsg.replace(/^[/@](dm|message|envoyer)\s*:?\s*/i, "").trim();
    const um = raw.match(/^@?([a-z0-9_]{1,30})\s+([\s\S]+)/i);
    if (um) return { toolToRun: "send_message", toolArgs: { username: um[1], content: um[2].trim() } };
    return null;
  }
  if (lower.startsWith("/settings") || lower.startsWith("@settings") || lower.startsWith("/parametres") || lower.startsWith("@parametres") || lower.startsWith("/paramètres") || lower.startsWith("/reglage")) {
    const raw = cleanMsg.replace(/^[/@](settings|parametres|paramètres|reglage|reglages)\s*:?\s*/i, "").trim();
    // Format simple : /settings theme dark /settings langue fr /settings fil trending
    const parts = raw.split(/\s+/);
    const key = (parts[0] || "").toLowerCase();
    const valRaw = parts.slice(1).join(" ").trim();
    const map: Record<string, string> = { theme: "theme_preference", dark: "dark", light: "light", langue: "ui_language", lang: "ui_language", fil: "feed_default_mode", mode: "feed_default_mode" };
    if (map[key]) {
      const field = map[key];
      let v: any = valRaw;
      if (field === "theme_preference" && ["dark", "light", "auto"].includes(valRaw.toLowerCase())) v = valRaw.toLowerCase();
      else if (field === "feed_default_mode" && ["for_you", "following", "trending"].includes(valRaw.toLowerCase())) v = valRaw.toLowerCase();
      if (v) return { toolToRun: "update_settings", toolArgs: { [field]: v } };
    }
    if (raw.toLowerCase().includes("auto_approve") || raw.toLowerCase().includes("approbation")) {
      const on = /on|oui|true|activer/i.test(raw);
      return { toolToRun: "update_settings", toolArgs: { mai_auto_approve_tools: on } };
    }
    return null;
  }
  if (lower.startsWith("/bookmark") || lower.startsWith("@bookmark") || lower.startsWith("/favori") || lower.startsWith("@favori") || lower.startsWith("/save")) {
    const raw = cleanMsg.replace(/^[/@](bookmark|favori|favoris|save)\s*:?\s*/i, "").trim();
    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return { toolToRun: "bookmark_post", toolArgs: { post_id: m[0] } };
    if (raw) return { toolToRun: "bookmark_post", toolArgs: { post_id: raw.split(/\s+/)[0] } };
    return null;
  }
  if (lower.startsWith("/repost") || lower.startsWith("@repost") || lower.startsWith("/republier")) {
    const raw = cleanMsg.replace(/^[/@](repost|republier)\s*:?\s*/i, "").trim();
    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return { toolToRun: "repost_post", toolArgs: { post_id: m[0] } };
    if (raw) return { toolToRun: "repost_post", toolArgs: { post_id: raw.split(/\s+/)[0] } };
    return null;
  }
  if (lower.startsWith("/comment") || lower.startsWith("@comment") || lower.startsWith("/commenter") || lower.startsWith("/reply")) {
    const raw = cleanMsg.replace(/^[/@](comment|commenter|commentaire|reply)\s*:?\s*/i, "").trim();
    const m = raw.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s+([\s\S]+)/i);
    if (m) return { toolToRun: "comment_post", toolArgs: { post_id: m[1], content: m[2].trim() } };
    return null;
  }
  if (lower.startsWith("/analyze") || lower.startsWith("@analyze") || lower.startsWith("/analyse") || lower.startsWith("/poststats") || lower.startsWith("/vues")) {
    const m = cleanMsg.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (m) return { toolToRun: "get_post_stats", toolArgs: { post_id: m[0] } };
    return null;
  }
  return null;
}

export async function getUserAutoApprove(sql: any, userId: number): Promise<boolean> {
  try {
    const rows = await sql`SELECT mai_auto_approve_tools FROM user_settings WHERE user_id = ${userId} LIMIT 1`;
    const value = rows[0]?.mai_auto_approve_tools;
    return value === true || value === 1 || value === "1" || value === "true";
  } catch {
    return false;
  }
}

/**
 * Réserve atomiquement le coût standard d'un appel mAI. Si la table de quota
 * n'existe pas encore, on conserve la compatibilité des anciennes installs ;
 * une autre erreur de base est traitée en fail-closed par l'appelant.
 */
export async function reserveMAIQuota(
  sql: any,
  userId: number,
  cost = 250
): Promise<{ ok: boolean; used: number; limit: number; reason?: string; unavailable?: boolean }> {
  const safeCost = Math.max(1, Math.min(10_000, Math.floor(Number(cost) || 250)));
  try {
    const userRows = await sql`SELECT tier FROM users WHERE id = ${userId} LIMIT 1`;
    const tier = String(userRows[0]?.tier || "Free");
    const limit = getTierMaiTokenLimit(tier);
    const { weekStartStr } = getWeekData();
    const rows = await sql`
      INSERT INTO weekly_usage (user_id, week_start, tokens_used)
      VALUES (${userId}, ${weekStartStr}::date, ${safeCost})
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET tokens_used = weekly_usage.tokens_used + ${safeCost}
      WHERE weekly_usage.tokens_used + ${safeCost} <= ${limit}
      RETURNING tokens_used
    `;
    if (rows.length > 0) {
      return { ok: true, used: Number(rows[0]?.tokens_used || 0), limit };
    }
    const usageRows = await sql`
      SELECT COALESCE(tokens_used, 0) AS tokens_used
      FROM weekly_usage WHERE user_id = ${userId} AND week_start = ${weekStartStr}::date LIMIT 1
    `;
    return {
      ok: false,
      used: Number(usageRows[0]?.tokens_used || 0),
      limit,
      reason: "Quota mAI hebdomadaire atteint.",
    };
  } catch (err: any) {
    // Une installation ancienne peut ne pas avoir encore weekly_usage. Ne pas
    // bloquer le chat dans ce cas ; les erreurs réelles de connexion restent
    // fail-closed pour éviter une consommation incontrôlée.
    if (/does not exist|relation .* does not exist|undefined table/i.test(String(err?.message || ""))) {
      return { ok: false, used: 0, limit: 0, reason: "Quota mAI indisponible.", unavailable: true };
    }
    return { ok: false, used: 0, limit: 0, reason: "Quota mAI indisponible." };
  }
}
