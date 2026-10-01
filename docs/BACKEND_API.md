# Backend mAI — architecture et routes

> Périmètre : **le graphe d'imports transitif complet de `main.ts`**, c'est-à-dire
> 42 fichiers / ~26 200 lignes / ~450 handlers. Base URL : `https://mai.val.run`.
>
> Ce document décrit le **backend Hono (Val Town)**, pas l'application Next.js.
> Pour le BFF Next et l'Agent, voir `AGENTS.md`, `docs/AGENT.md` et
> `docs/AI_AGENTS_API.md`.

---

## Sommaire

1. [Ce qu'est ce dépôt](#1-ce-quest-ce-dépôt)
2. [Cycle de vie de `main.ts`](#2-cycle-de-vie-de-maints)
3. [Sécurité : CORS et en-têtes](#3-sécurité-cors-et-en-têtes)
4. [`api-middleware.ts` — auth, quota, journalisation](#4-api-middlewarets--auth-quota-journalisation)
5. [`config.ts` — forfaits, base, JWT](#5-configts--forfaits-base-jwt)
6. [Les huit registres de l'API](#6-les-huit-registres-de-lapi)
7. [Vibe — la plateforme sociale](#7-vibe--la-plateforme-sociale)
8. [Index des 42 fichiers](#8-index-des-42-fichiers)
9. [Code mort et pièges connus](#9-code-mort-et-pièges-connus)
10. [Codes d'erreur et limites](#10-codes-erreur-et-limites)

---

## 1. Ce qu'est ce dépôt

Le dépôt contient **deux applications qui ne se compilent pas ensemble**.

| | Next.js | Backend Hono (ce document) |
|---|---|---|
| Racine | `app/`, `components/`, `lib/`, `hooks/` | ~45 `*.ts` **à la racine** |
| Entrypoint | `app/layout.tsx` | `main.ts` |
| Typecheck | oui | **non** — hors du `include` de `tsconfig.json` |
| Build | `next build` | aucun, déployé par Val Town |

Conséquence pratique : **modifier un fichier `*.ts` de la racine ne déclenche ni
`tsc` ni `next build`**. Ces fichiers n'ont aucune protection automatique. Toute
erreur n'apparaît qu'au déploiement ou à l'appel.

Le rôle du backend est d'être **l'API publique de mAI** (compatibilité OpenAI) et
l'hôte de la plateforme sociale « vibe ». L'application Next est un BFF qui
l'interroge via `MAI_API_URL`.

---

## 2. Cycle de vie de `main.ts`

`main.ts` fait exactement cinq choses, dans cet ordre.

### 2.1 Initialisation SQLite — non bloquante

```ts
initSQLite().catch(console.error);
```

Volontairement **non attendu** : le démarrage ne dépend pas de la base. Une
base indisponible ne doit pas empêcher de répondre sur `/status` ni sur les
routes publiques.

### 2.2 Application et CORS

```ts
const app = new Hono();
```

Voir [section 3](#3-sécurité-cors-et-en-têtes).

### 2.3 En-têtes de sécurité — middleware global

```ts
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Frame-Options", "DENY");
  c.header("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
});
```

Appliqués **après** `next()` : ils survivent à la réponse du handler.
`microphone=(self)` est nécessaire parce que la dictée vocale du client web
utilise `getUserMedia`.

### 2.4 Routes racines

```ts
app.get("/", (c) => c.text("mAI"));
```

Chacune des huit — `/`, `/api`, `/api/`, `/v1`, `/v1/`, `/vibe`, `/vibe/`,
`/api/vibe`, `/api/vibe/` — renvoie le texte `mAI`. C'est la **réponse
d'identification** : un client détecte qu'il parle bien à mAI et pas à une
erreur de routage.

### 2.5 Montage des registres — **l'ordre est significatif**

```ts
registerMiddleware(app);        // auth + quota + logs
registerAuthRoutes(app);
registerStorageRoutes(app);
registerModelRoutes(app);
registerImageRoutes(app);
registerAudioRoutes(app);
registerWebRoutes(app);
registerProjectRoutes(app);
registerDeviceRoutes(app);
registerVibeRoutes(app);        // tout le social
```

Hono conserve l'ordre d'enregistrement dans son routeur : **la première route
correspondante gagne**. C'est pourquoi `registerVibeFeedRoutes` est monté avant
`registerVibePostsRoutes` — pour que la route statique `/v1/posts/top` (feed)
prime sur `/v1/posts/:id` (détail d'un post).

### 2.6 Export

```ts
export default app.fetch;
```

Signature attendue par Val Town. **Il n'y a pas de `app.onError(...)`** : chaque
route gère ses erreurs par `try/catch` + `c.json({ error }, status)`, et le
middleware d'authentification rend directement ses 401/403/429/503. Une exception
non rattrapée remonte au runtime de la plateforme.

---

## 3. Sécurité : CORS et en-têtes

### 3.1 Allowlist stricte — jamais de réflexion

```ts
const ALLOWED_ORIGINS = new Set([
  "https://mai-vibe.vercel.app",
  "https://mai-vibe-git-main-mcompany.vercel.app",
  "http://localhost:5173", "http://127.0.0.1:5173",
  "http://localhost:3000", "http://127.0.0.1:3000",
  "capacitor://localhost", "https://localhost",
]);
```

La fonction `origin` **rejette** au lieu de refléter :

```ts
origin: (origin) => {
  if (!origin) return null;
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  if (/^https:\/\/mai-vibe[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
  return null;
},
```

`credentials: true` est activé. C'est précisément pourquoi **réfléter une
origine inconnue serait une faille** : n'importe quel site pourrait lire les
réponses avec les cookies de l'utilisateur. Deux échappatoires sont
intentionnelles :

- `localhost` / `127.0.0.1` sur **n'importe quel port** — développement ;
- `*.vercel.app` pour les previews `mai-vibe-*` — le motif
  `mai-vibe[a-z0-9-]*` limite toutefois la préfixe à `mai-vibe`.

### 3.2 En-têtes autorisés

| Catégorie | Valeurs |
|---|---|
| `allowHeaders` | `Content-Type`, `Authorization`, `x-user-id`, `x-api-key`, `x-goog-api-key`, `x-web-search`, `x-disable-web-search`, `anthropic-version`, `anthropic-beta` |
| `allowMethods` | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS` |
| `exposeHeaders` | `Content-Type`, `Authorization`, `x-user-id` |
| `maxAge` | `86 400` (24 h) |

`x-goog-api-key` et `anthropic-beta` autorisent les SDK Google et Anthropic à
passer par le même endpoint.

---

## 4. `api-middleware.ts` — auth, quota, journalisation

Un seul `app.use("*")`, mais il **ne s'applique qu'à une allowlist de chemins**
(`isApiRoute`, ~30 préfixes : `/v1/*`, `/models*`, `/chat/completions`,
`/messages*`, `/speech*`, `/images*`, `/mj*`, `/audio/*`, `/usage*`,
`/log-usage`, `/status`). Tout le reste — le social vibe, l'authentification,
les projets — passe à travers.

Cette distinction est essentielle : elle permet d'avoir une **API publique de
production durcie par clé API** coexistant avec une **API sociale ouverte**.

### 4.1 Hiérarchie d'authentification

Ordre strict, dans un `if (apiKey)` :

| Rang | Source | Forfait retenu | Identifiant |
|---|---|---|---|
| 1 | **Clé API enregistrée** dans `mprojects_api_keys` | `users.tier`, sinon `plan`, sinon `Plus` | `k.user_id` |
| 1 bis | **Forfait encodé dans la clé** (`extractTierFromApiKey`) | fait foi **en priorité** sur le 1 | — |
| 2 | **Clé système** `MAI_API_KEY` (comparaison à temps constant) | `Plus` | `system-mai` |
| 3 | **JWT de session** (`verifyToken`) | `payload.tier`, puis relu en base | `payload.sub` |
| 4 | En-tête `x-user-id` | `users.tier` | l'en-tête |

Détails qui comptent :

- La clé est lue depuis `Authorization: Bearer …`, `x-api-key`,
  `x-goog-api-key`, `?api_key=` ou `?key=`. Les valeurs sentinelles
  (`""`, `"null"`, `"undefined"`, `"Bearer"`) sont normalisées à `null`.
- `x-user-id` **ne promeut jamais** une authentification absente vers une route
  privée : il est ignoré avec un `console.warn`. Sur une route publique, il est
  accepté. S'il contredit une identité déjà établie, il est ignoré.
- Le tier issu du JWT est **relu en base** : uneubscription válida dans le JWT ne
  survit pas à un changement de forfait.
- La comparaison de la clé système est à temps constant
  (`timingSafeEqual`, comparaison de longueurs puis XOR).

### 4.2 Refus

| Situation | Statut | Corps |
|---|---|---|
| Clé présente, inconnue, route privée | `403` | `{ error: "Invalid API Key." }` |
| Base injoignable pendant l'auth | `503` | `{ error: "Authentication service unavailable." }` |
| Aucune clé ni identité, route privée | `401` | `{ error: "Service Unavailable. API Key missing." }` |
| Quota hebdomadaire épuisé | `429` | `{ code: "quota_exceeded", limit, remaining, resetAt, used }` |

Sur une route **publique**, un quota épuisé **laisse passer** la requête
(`await next()`) au lieu de la refuser.

### 4.3 Contexte posé sur le contexte Hono

```ts
c.set("userPlan", userPlan);
c.set("userId", currentUserId);
c.set("apiKey", currentApiKey);
c.set("matchedApiKey", matchedApiKey);
```

Plus `requestQuota` (objet) et le fanion `quotaDebitedByHandler` posé par les
handlers qui débitent eux-mêmes.

### 4.4 Quota hebdomadaire

- Somme de `request_count` sur **toutes** les clés du compte, plus
  `getUserQuotaBoost(userId, "api")`.
- Période hebdo (lundi 00:00 UTC) via `getWeekData()`.
- Reset idempotent par `usage_period_start`.
- **Un JWT de session ne consomme pas ce quota** : le compteur n'est incrémenté
  que pour les clés enregistrées.

### 4.5 Journalisation après `next()`

```ts
INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms)
```

Exclut : `/v1/devices*`, `/v1/status`, `/status`. Puis `request_count + 1` et
`last_used_at = NOW()` sur la clé correspondante, **sauf** si le handler a posé
`quotaDebitedByHandler` (évite un double débit sur les routes images, qui
consomment plusieurs crédits). Les erreurs de journalisation sont loguées et
**n'interrompent pas** la réponse.

---

## 5. `config.ts` — forfaits, base, JWT

`config.ts` n'importe **aucun module local** : c'est la racine du graphe.

### 5.1 Forfaits

```ts
export type Tier = "Free" | "Plus" | "Pro" | "Max";
```

**Casse Title** côté backend, contre **minuscule** côté Next (`lib/auth/plan.ts`).
C'est une frontière de traduction, pas un oubli.

`normalizeTier` accepte les alias via `TIER_ALIASES` (`free`, `gratuit`, `plus`,
`pro`, `max`) et retombe sur `Free`.

Sept tables, chacune avec son getter :

| Table | Getter | Rôle |
|---|---|---|
| `TIER_LIMITS` | `getTierMaiTokenLimit` | tokens mAI |
| `TIER_SPEECH_LIMITS` | `getTierSpeechLimit` | tokens speech |
| `TIER_REQUEST_LIMITS` | `getTierRequestLimit` | requêtes API / semaine |
| `TIER_AGENT_LIMITS` | `getTierAgentLimit` | agents (`null` = illimité) |
| `TIER_DAILY_IMAGE_LIMITS` | `getTierDailyImageLimit` | images / jour |
| `TIER_IMAGE_REQUEST_COST` | `getTierImageRequestCost` | coût multi-crédits |
| `STORAGE_LIMITS_BYTES` | `getTierStorageLimitBytes` | stockage cloud |

> ⚠️ Ces tables sont le **miroir** de `lib/plans/tier-limits.ts`. Toute évolution
> de forfait doit être répercutée **des deux côtés**, sinon l'interface annonce
> une limite que le backend n'applique pas (ou l'inverse). Le commentaire en
> tête de `lib/plans/tier-limits.ts` le rappelle explicitement.

### 5.2 Base de données

`getDb()` renvoie un client `postgres` (Neon). `initSQLite()` initialise une base
SQLite séparée via `https://esm.town/v/std/sqlite`, utilisée par la plateforme
vibe. **Les deux coexistent** : le backend n'est pas sur une seule base.

### 5.3 JWT

| Élément | Valeur |
|---|---|
| Algorithme | HS256, secret `JWT_SECRET` |
| Expiration | `JWT_EXPIRY = "14d"` |
| Révocation | `blacklistToken(token)` |
| Extraction | `extractToken(req)` — Bearer, puis en-têtes, puis cookie |
| Mots de passe | `BCRYPT_ROUNDS = 12` |
| Codes de vérification | `generateVerificationCode` / `verifyVerificationCode` |
| Période | `getWeekData()` (lundi 00:00 UTC) |

### 5.4 Divers

`getEnv` (variables d'environnement), `clientIp`, `rateLimit` /
`rateLimitResponse` (rate limiting interne, distinct du quota de clés API),
`parseUserAgent`.

---

## 6. Les huit registres de l'API

### Convention d'alias

La quasi-totalité des routes sont montées **deux à quatre fois** : avec et sans
le préfixe `/v1`, avec et sans slash final.

```
GET /v1/models   ·  /models   ·  /v1beta/models
```

C'est une compatibilité OpenAI / SDK d'Éditeurs. Le graphe réel est donc
nettement plus large que le nombre de handlers.

### 6.1 `auth.ts` (1 051 l.) — inscription et identité

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api-keys` | lister les clés API du compte |
| `GET` | `/userId` | identité de la clé courante |
| `POST` | `/verify-code` | valider un code de vérification |
| `POST` | `/update-profile` | modifier le profil |
| `POST` | `/verify-new-email` | changer d'e-mail (OTP) |
| `POST` | `/request-delete-account` | suppression de compte (étape 1) |
| `POST` | `/confirm-delete-account` | suppression de compte (étape 2) |

Importe `email.ts` (envoi via `nodemailer`) et `vibe-common.ts` (JWT → `userId`).

### 6.2 `storage.ts` (1 043 l.) — 93 handlers, le plus volumineux

| Domaine | Routes (modèle) |
|---|---|
| Avatars | `POST /upload-avatar`, `/v1/upload-avatar` |
| Fichiers | `POST /upload-file`, `/v1/upload-file` |
| Stockage | `GET /cloud/storage`, `/storage`, `/cloud/files`, `/files` |
| Cycle de vie | `PATCH /cloud/files/:id`, `DELETE /cloud/files/:id` |

### 6.3 `models.ts` (1 004 l.) — 36 handlers, le cœur de l'API

| Domaine | Routes |
|---|---|
| Catalogue | `GET /v1/models`, `/models`, `/v1beta/models` |
| Catalogue mAI | `GET /v1/models/mai`, `/v1/mai/models`, `/models/mai`, `/mai/models` |
| Complétions | `POST /v1/chat/completions`, `/chat/completions` |
| Messages (Anthropic) | `POST /v1/messages`, `/messages` |
| Gemini | `POST /v1/models/*:generateContent`, `*:streamGenerateContent` |
| Statut | `GET /v1/status`, `/status` |
| Usage | `GET /usage`, `/v1/usage` · `POST /log-usage`, `/v1/log-usage` |

Importe `maiModels.ts` (281 l.) : le catalogue de modèles mAI.

### 6.4 `images.ts` (1 806 l.) — 59 handlers

| Domaine | Routes |
|---|---|
| Catalogue | `GET /v1/models/images`, `/v1/images/models`, `/models/images/:id` |
| Génération | `POST /v1/images/generations` |
| Quota | `GET /v1/images/usage` |
| Historique | `GET` / `PATCH` `/v1/images/history[/:id]` |
| Midjourney | `POST /mj/submit/{imagine,action,describe,blend}` · `GET /mj/task/:id/fetch` |

### 6.5 `audio.ts` (835 l.) — 54 handlers

| Domaine | Routes |
|---|---|
| Catalogues | `GET /v1/models/speech`, `/v1/audio/models`, `/v1/speech/voices` |
| Synthèse | `POST /v1/audio/speech` |
| Quota | `GET /v1/audio/usage`, `/v1/speech/usage` |
| Historique | `GET` / `PATCH` / `DELETE` `/v1/audio/history[/:id]` |

### 6.6 `web.ts` (438 l.) — 7 handlers

`GET|POST /v1/web/search` — recherche web, avec prise en compte des en-têtes
`x-web-search` et `x-disable-web-search`.

### 6.7 `projects.ts` (650 l.) — 12 handlers

`GET|POST /v1/projects` · `GET|PUT|DELETE /v1/projects/:id` ·
`GET /v1/projects/:id/stats`

### 6.8 `devices.ts` (153 l.) — 10 handlers

`GET /v1/devices` · `GET /userId` · `PUT|DELETE /v1/devices/:id` ·
`DELETE /v1/devices/others` · `DELETE /v1/devices/all`

Utilise aussi la base SQLite. Exclu de la journalisation de quota.

---

## 7. Vibe — la plateforme sociale

`vibe.ts` (53 l.) est un simple orchestrateur : il crée un `registerMulti` puis
monte 8 domaines.

### 7.1 Le motif `registerMulti`

`vibe-common.ts` expose `createRegisterMulti(app)` : une fonction qui enregistre
**un même handler sous plusieurs chemins**.

```ts
registerMulti("get", ["/api/vibe/feed", "/vibe/feed", "/v1/feed", "/feed"], handler);
```

Quatre alias : `/api/vibe/*`, `/vibe/*`, `/v1/*`, et parfois le chemin nu. Un
seul handler à maintenir, quatre URLs publiques. C'est le moyen de supporter
simultanément les anciens clients, les SDK OpenAI et le front vibe.

Le même fichier fournit `isBlockEitherWay` (blocage bidirectionnel),
`resolveHiddenUserIds` (comptes masqués + blocages, à exclure des feeds) et
`getAuthUserId(c)` (JWT → `number | null`).

### 7.2 Les huit domaines

| Domaine | Fichiers | Lignes |
|---|---|---|
| Feed | `vibe-feed.ts` (915) + `vibe-recommender.ts` (276) + `vibe-circle.ts` (206) | ~1 400 |
| Posts | `vibe-posts.ts` (52) + `-core` (562) + `-crud` (1 560) + `-engage` (1 184) | ~3 360 |
| Users | `vibe-users.ts` (1 417) | ~1 420 |
| DMs | `vibe-dms.ts` (42) + `-core` (716) + `-conversations` (808) + `-groups` (547) + `-message-actions` (667) + `-moderation` (447) + `-notifications` (232) | ~3 460 |
| Settings | `vibe-settings.ts` (348) + `vibe-tools.ts` (698) | ~1 050 |
| mAI | `vibe-mai.ts` (36) + `-core` (1 318) + `-chat` (543) + `-conversations` (305) + `-execute` (492) + `-settings` (136) + `-fleet` (1 728) | ~4 560 |
| Circle | `vibe-circle.ts` (206) | ~210 |
| Books | `vibe-books.ts` (1 445) + `-conversations` (309) | ~1 750 |

`vibe-users.ts` importe `storage.ts` et `vibe-circle.ts` : le social **réutilise
le registre de stockage de l'API principale**, pas une implémentation séparée.

### 7.3 DDL au chargement

Contrairement au Next.js, le backend **crée ses tables au montage** :

- `vibe-dms.ts` → `ensureDMTables()` + `ensureMAIAccount()`
- `vibe-mai.ts` → `ensureMAIConversations()`
- `vibe-posts.ts` → `ensurePostColumns()` (en tâche de fond, `.catch(() => {})`)

Ces fonctions idempotentes s'exécutent sur la base **SQLite**, pas sur Neon. Ne
pas confondre avec l'interdiction de DDL au runtime côté Next
(`DB_RUNTIME_DDL_REPAIR`).

### 7.4 Temps réel

`realtime.ts` (309 l.) expose `pushRealtimeEvent`, importé par **six** fichiers
(vibe-books, vibe-dms-conversations, -core, -groups, -moderation, vibe-posts-crud,
-engage) et `ensureRealtimeTables()`.

Il définit aussi `registerRealtimeRoutes` — **jamais appelée** (voir section 9).

---

## 8. Index des 42 fichiers

Les 42 fichiers du graphe d'imports transitif de `main.ts`, avec leurs
imports locaux. Toutes les dépendances externes sont listées en fin de section.

### Racine

| Fichier | L. | Importe |
|---|---|---|
| `main.ts` | 113 | `api-middleware`, `audio`, `auth`, `config`, `devices`, `images`, `models`, `projects`, `storage`, `vibe`, `web` |
| `api-middleware.ts` | 359 | `config` |
| `config.ts` | 534 | *(aucun)* |
| `auth.ts` | 1 051 | `config`, `email`, `vibe-common` |
| `email.ts` | 507 | *(aucun)* |
| `storage.ts` | 1 043 | `config` |
| `models.ts` | 1 004 | `config`, `maiModels` |
| `maiModels.ts` | 281 | *(aucun)* |
| `images.ts` | 1 806 | `config` |
| `audio.ts` | 835 | `config` |
| `web.ts` | 438 | *(aucun)* |
| `projects.ts` | 650 | `config` |
| `devices.ts` | 153 | `config` |
| `realtime.ts` | 309 | *(aucun)* |

### Vibe

| Fichier | L. | Importe |
|---|---|---|
| `vibe.ts` | 53 | `vibe-books`, `vibe-circle`, `vibe-common`, `vibe-dms`, `vibe-feed`, `vibe-mai`, `vibe-mai-fleet`, `vibe-posts`, `vibe-recommender`, `vibe-settings`, `vibe-users` |
| `vibe-common.ts` | 98 | `config` |
| `vibe-feed.ts` | 915 | `config`, `vibe-circle`, `vibe-common`, `vibe-posts-core`, `vibe-recommender` |
| `vibe-recommender.ts` | 276 | *(aucun)* |
| `vibe-circle.ts` | 206 | `config`, `vibe-common` |
| `vibe-posts.ts` | 52 | `vibe-common`, `vibe-feed`, `vibe-posts-core`, `vibe-posts-crud`, `vibe-posts-engage` |
| `vibe-posts-core.ts` | 562 | *(aucun)* |
| `vibe-posts-crud.ts` | 1 560 | `realtime` |
| `vibe-posts-engage.ts` | 1 184 | `realtime` |
| `vibe-users.ts` | 1 417 | `config`, `storage`, `vibe-circle`, `vibe-common`, `vibe-posts-core` |
| `vibe-dms.ts` | 42 | `vibe-common`, `vibe-dms-conversations`, `vibe-dms-core`, `vibe-dms-groups`, `vibe-dms-message-actions`, `vibe-dms-moderation`, `vibe-dms-notifications` |
| `vibe-dms-core.ts` | 716 | `realtime` |
| `vibe-dms-conversations.ts` | 808 | `realtime` |
| `vibe-dms-groups.ts` | 547 | `realtime` |
| `vibe-dms-message-actions.ts` | 667 | *(aucun)* |
| `vibe-dms-moderation.ts` | 447 | `realtime` |
| `vibe-dms-notifications.ts` | 232 | *(aucun)* |
| `vibe-settings.ts` | 348 | `config`, `vibe-common`, `vibe-tools` |
| `vibe-tools.ts` | 698 | *(aucun)* |
| `vibe-mai.ts` | 36 | `vibe-common`, `vibe-mai-chat`, `vibe-mai-conversations`, `vibe-mai-core`, `vibe-mai-execute`, `vibe-mai-settings` |
| `vibe-mai-core.ts` | 1 318 | *(aucun)* |
| `vibe-mai-chat.ts` | 543 | `vibe-tools` |
| `vibe-mai-conversations.ts` | 305 | *(aucun)* |
| `vibe-mai-execute.ts` | 492 | `vibe-tools` |
| `vibe-mai-settings.ts` | 136 | `vibe-tools` |
| `vibe-mai-fleet.ts` | 1 728 | *(aucun)* |
| `vibe-books.ts` | 1 445 | `config`, `realtime`, `vibe-books-conversations`, `vibe-common`, `vibe-dms-core`, `vibe-posts-core` |
| `vibe-books-conversations.ts` | 309 | *(aucun)* |

### Dépendances externes (7)

| Spécificateur | Utilisé par |
|---|---|
| `npm:hono@4` | 31 fichiers |
| `npm:hono/cors` | `main.ts` |
| `npm:hono/streaming` | `realtime.ts` |
| `npm:@neondatabase/serverless` | `config.ts` |
| `https://esm.town/v/std/sqlite` | `config.ts`, `devices.ts` |
| `npm:jose` | `config.ts` |
| `npm:bcryptjs` | `auth.ts` |
| `npm:nodemailer` | `email.ts` |

**Tous** les imports sont `npm:` ou des URLs — **aucun** module externe
installé par `package.json`, **aucun** spécificateur nu. C'est ce qui permet au
backend de vivre dans le même dépôt que l'app Next sans que Vercel ne le
tente de builder.

---

## 9. Code mort et pièges connus

Relevés par analyse statique du graphe. À traiter avant toute cleanup, pour ne
pas « corriger » du code qui n'est simplement pas atteint.

### 9.1 `vibe-ai.ts` — fichier orphelin (16 ko)

Définit `registerVibeAIRoutes` (ligne 101) mais **n'est importé par aucun
fichier**. Il est donc absent du graphe de `main.ts` et jamais déployé
utilement. Contrairement aux deux cas suivants, son contenu n'est probablement
pas repris ailleurs.

### 9.2 `registerRealtimeRoutes` — définie, jamais appelée

`realtime.ts:86` définit un endpoint SSE complet (heartbeat, timeout
`HEARTBEAT_TICKS = 15`, purge `UNREAD_TICKS = 30`,
`NOTIF_POLL_TICKS = 2`, `MAX_CONNECTIONS_PER_USER = 2`, rattrapage des événements
émis dans les 3 s preceding la connexion). **Le registre n'est jamais appelé** :
aucun endpoint SSE n'est monté.

Conséquence : `pushRealtimeEvent` écrit dans les tables de la base mais
**personne ne les lit**. Le temps réel de la plateforme sociale est inactif.
`vibe-feed.ts:24` utilise `HybridRecommender` (recommandation) et fonctionne
indépendamment du SSE.

### 9.3 `registerVibeFeedRoutes` monté deux fois

`vibe.ts:44` puis `vibe-posts.ts:47`. Le second appel n'est **pas** protégé,
contrairement à `registerVibePostsRoutes` qui utilise le fanion
`__vibe_posts_registered`. Hono ignore la seconde inscription, donc le
comportement est correct — mais c'est fragile : une modification d'un des deux
sites peut créer un doublon silencieux.

### 9.4 `0014_notifications_and_memory.sql` — migration orpheline

Ce fichier n'existe **pas** côté Next (migrations numérotées `NNNN_*.sql` de
`lib/db/migrations/`). Aucun impact ici ; signalé parce que le nom existe aussi
dans l'autre runtime avec un contenu différent.

### 9.5 Pas de gestionnaire d'erreurs global

L'absence de `app.onError(...)` signifie qu'une exception non rattrapée dans un
handler produit une réponse 500 **au format du runtime Val Town**, pas au format
`{ error }` attendu par les clients. Chaque nouveau handler doit donc avoir son
`try/catch`.

---

## 10. Codes d'erreur et limites

### 10.1 Réponses du middleware

| Statut | Corps | Déclencheur |
|---|---|---|
| `200` + `quota_exceeded` évité | — | route publique à quota épuisé |
| `401` | `{ error: "Service Unavailable. API Key missing." }` | aucune clé ni identité sur une route privée |
| `403` | `{ error: "Invalid API Key." }` | clé inconnue sur une route privée |
| `429` | `{ code: "quota_exceeded", error, limit, remaining, resetAt, used }` | quota hebdomadaire épuisé |
| `503` | `{ error: "Authentication service unavailable." }` | base injoignable pendant l'auth |

Handlers : `{ error: string }`. C'est un format **différent** de celui du BFF Next
(`{ code, message, status, details? }`, voir `lib/api/error-response.ts`), que
`normalizeUpstreamError` se charge de traduire.

### 10.2 Limites par forfait

Sept quotas, définis en double (voir [5.1](#51-forfaits)). Points d'application :

| Quota | Appliqué dans |
|---|---|
| Tokens mAI | `models.ts`, `lib/agent/budget` côté Next |
| Tokens speech | `audio.ts` |
| Requêtes API / semaine | `api-middleware.ts` (uniquement clés enregistrées) |
| Agents | `vibe-mai-fleet.ts` |
| Images / jour | `images.ts` |
| Coût multi-crédits image | `images.ts`, via `quotaDebitedByHandler` |
| Stockage | `storage.ts` |

Un niveau d'images, un niveau de parole et un niveau de stockage par compte
sont aussi contrôlés côté Next via `lib/plans/tier-limits.ts`, qui lit les
quotas renvoyés par l'API plutôt que de les recalculer.

---

## Voir aussi

- `AGENTS.md` — dépôt, stack, conventions, migrations
- `docs/AGENT.md` — l'espace Agent (exécution, budgets, outils)
- `docs/AI_AGENTS_API.md` — API publique pour agents externes
- `docs/plugins-public-apis.md` — API HTTP tierless utilisées par les plugins
