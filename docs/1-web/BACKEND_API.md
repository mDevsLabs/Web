# Backend mAI — architecture et routes

> Périmètre: **le graphe d'imports transitif complet de `main.ts`**, c'est-à-dire
> 64 fichiers / 34 145 lignes / 659 déclarations de routes relevées dans `API_INVENTORY.json`. Base URL: `https://mai.val.run`.
>
> Ce document décrit le **backend Hono (Val Town)**, pas l'application Next.js.
> Pour le BFF Next et l'Agent, voir `AGENTS.md`, `docs/1-web/AGENT_ENGINE.md` et
> `docs/1-web/AI_AGENTS_API.md`.

---

## Sommaire

1. [Ce qu'est ce dépôt](#1-ce-quest-ce-dépôt)
2. [Cycle de vie de `main.ts`](#2-cycle-de-vie-de-maints)
3. [Sécurité: CORS et en-têtes](#3-sécurité-cors-et-en-têtes)
4. [`api-middleware.ts` — auth, quota, journalisation](#4-api-middlewarets--auth-quota-journalisation)
5. [`config.ts` — forfaits, base, JWT](#5-configts--forfaits-base-jwt)
6. [Les huit registres de l'API](#6-les-huit-registres-de-lapi)
7. [Vibe — la plateforme sociale](#7-vibe--la-plateforme-sociale)
8. [Index des modules backend](#8-index-des-modules-backend)
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

Conséquence pratique: **modifier un fichier `*.ts` de la racine ne déclenche ni
`tsc` ni `next build`**. Ces fichiers n'ont aucune protection automatique. Toute
erreur n'apparaît qu'au déploiement ou à l'appel.

Le rôle du backend est d'être **l'API publique de mAI** (compatibilité OpenAI) et
l'hôte de la plateforme sociale « vibe». L'application Next est un BFF qui
l'interroge via `MAI_API_URL`.

---

## 2. Cycle de vie de `main.ts`

L’import à effets de bord `models-cron.ts` précède le corps du module. Le détail à jour du graphe et des registres est dans [BACKEND_AUDIT.md](BACKEND_AUDIT.md); l’inventaire [API_INVENTORY.json](API_INVENTORY.json) se régénère avec `node scripts/audit-backend.mjs`. Les nombres historiques de handlers ne représentent pas une preuve de couverture.

`main.ts` effectue les étapes suivantes, dans cet ordre.

### 2.1 Initialisation SQLite — non bloquante

```ts
initSQLite().catch(console.error);
```

Volontairement **non attendu**: le démarrage ne dépend pas de la base. Une
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

Appliqués **après** `next()`: ils survivent à la réponse du handler.
`microphone=(self)` est nécessaire parce que la dictée vocale du client web
utilise `getUserMedia`.

### 2.4 Routes racines

```ts
app.get("/", (c) => c.text("mAI"));
```

Chacune des neuf — `/`, `/api`, `/api/`, `/v1`, `/v1/`, `/vibe`, `/vibe/`,
`/api/vibe`, `/api/vibe/` — renvoie le texte `mAI`. C'est la **réponse
d'identification**: un client détecte qu'il parle bien à mAI et pas à une
erreur de routage.

### 2.5 Montage des registres — **l'ordre est significatif**

```ts
registerMiddleware(app); // auth + quota + logs
registerAuthRoutes(app);
registerStorageRoutes(app);
registerModelRoutes(app);
registerImageRoutes(app);
registerAudioRoutes(app);
registerWebRoutes(app);
registerProjectRoutes(app);
registerDeviceRoutes(app);
registerRealtimeRoutes(app);
registerVibeAIRoutes(app);
registerTranslateRoutes(app);
registerMaiTranslateRoutes(app);
registerVibeRoutes(app); // tout le social
```

Hono conserve l'ordre d'enregistrement dans son routeur: **la première route
correspondante gagne**. C'est pourquoi `registerVibeFeedRoutes` est monté avant
`registerVibePostsRoutes` — pour que la route statique `/v1/posts/top` (feed)
prime sur `/v1/posts/:id` (détail d'un post).

### 2.6 Export

```ts
export default app.fetch;
```

Signature attendue par Val Town. **Il n'y a pas de `app.onError(...)`**: chaque
route gère ses erreurs par `try/catch` + `c.json({ error }, status)`, et le
middleware d'authentification rend directement ses 401/403/429/503. Une exception
non rattrapée remonte au runtime de la plateforme.

### 2.7 Les vals hors graphe

Deux vals de la racine ne sont **pas** dans le graphe d’imports de `main.ts`: ils ont leur propre déclencheur, donc l’inventaire ne les liste pas.

| Val | Déclencheur | Rôle |
|---|---|---|
| `updateModels.ts` | CRON Val Town (`0 */12 * * *`) | Synchronise le catalogue OpenRouter; importé par `models-cron.ts` pour `Deno.cron` |
| `cron.ts` | CRON Val Town (`*/5 * * * *`) | Appelle les quatre routes cron de l’application Next (`/api/cron/agent`, `/planning`, `/wakies`, `/vibe`) avec `CRON_SECRET` |

`cron.ts` est le seul planificateur de ces quatre ticks: les quatre appels partent en parallèle pour tenir dans le plafond d’exécution d’un val, et l’échec d’un tick fait échouer la run sans jamais masquer les trois autres. Il remplace `.github/workflows/cron-tasks.yml`, supprimé. Une cadence de 5 minutes suppose le plan Pro de Val Town (intervalle minimal d’une minute).

---

## 3. Sécurité: CORS et en-têtes

### 3.1 Origines ouvertes, sans cookies

Le code actuel de `main.ts` configure `origin: "*"` et `credentials: false`.
Les clients directs utilisent un en-tête `Authorization`, pas les cookies du
navigateur. Une réponse explicite `OPTIONS *` renvoie 204 avant l’authentification.
Cette configuration autorise les origines locales, de preview et de production;
elle ne constitue pas une allowlist. L’identité et les quotas restent vérifiés
par les handlers et le middleware. Le cookie mAI du BFF Next constitue un autre
périmètre et ne doit pas être confondu avec ce CORS.

### 3.2 En-têtes autorisés

| Catégorie | Valeurs |
|---|---|
| `allowHeaders` | `Content-Type`, `Authorization`, `x-user-id`, `x-api-key`, `x-goog-api-key`, `x-web-search`, `x-disable-web-search`, `anthropic-version`, `anthropic-beta` |
| `allowMethods` | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD` |
| `exposeHeaders` | `Content-Type`, `Authorization`, `x-user-id` |
| `maxAge` | `86 400` (24 h) |

`x-goog-api-key` et `anthropic-beta` autorisent les SDK Google et Anthropic à
passer par le même endpoint.

---

## 4. `api-middleware.ts` — auth, quota, journalisation

Un seul `app.use("*")`, mais il **ne s'applique qu'à une allowlist de chemins**
(`isApiRoute`, ~30 préfixes: `/v1/*`, `/models*`, `/chat/completions`,
`/messages*`, `/speech*`, `/images*`, `/mj*`, `/audio/*`, `/usage*`,
`/log-usage`, `/status`). Tout le reste — le social vibe, l'authentification,
les projets — passe à travers.

Cette distinction est essentielle: elle permet d'avoir une **API publique de
production durcie par clé API** coexistant avec une **API sociale ouverte**.

### 4.1 Hiérarchie d'authentification

Ordre strict, dans un `if (apiKey)`:

| Rang | Source | Forfait retenu | Identifiant |
|---|---|---|---|
| 1 | **Clé API enregistrée** dans `mprojects_api_keys` (clé active, propriétaire existant) | **`users.tier` uniquement** | `users.id` canonique |
| 2 | **Clé système** `MAI_API_KEY` (comparaison à temps constant) | `Plus` | `system-mai` |
| 3 | **JWT de session** (`verifyToken`) | `payload.tier`, **relu en base** | `payload.sub` |

Détails qui comptent:

- Le **préfixe** d'une clé (`mai-max-…`) n'accorde **aucun** privilège : une
  clé inconnue, désactivée (`is_active = false`) ou orpheline n'authentifie
  personne. Sur une route publique, elle reste au niveau public le plus strict ;
  sur une route privée, elle répond 403.
- La **limite individuelle** d'une clé (`max_limit`) est vérifiée dans la même
  réservation atomique que le quota du compte ; une clé à sa limite répond 429.
- Un **compte bloqué** (`users.is_blocked`) est refusé (403) pour ses clés comme
  pour son JWT. `verifyToken` revérifie l'état du compte à chaque usage.
- Le tier d'une clé suit donc une **rétrogradation** sans renouvellement de la
  clé : la base est l'autorité.
- `x-user-id` **ne promeut jamais** une identité, même sur une route publique.
  Un en-tête fourni par le client n'est pas une authentification ; les routes
  sociales publiques vérifient elles-mêmes le JWT.
- La comparaison de la clé système est à temps constant
  (`timingSafeEqual`, comparaison de longueurs puis XOR).
- L'en-tête `X-Forwarded-For` retenu pour les limites est la **dernière** entrée
  (celle ajoutée par le proxy de bord), jamais la première (fournie par le
  client). Les parcours de sécurité (inscription, connexion, vérification et
  renvoi de code) utilisent un compteur **partagé** SQLite (`rateLimitShared`).

### 4.2 Refus

| Situation | Statut | Corps |
|---|---|---|
| Clé présente, inconnue/désactivée/orpheline, route privée | `403` | `{ error: "Invalid API Key." }` |
| Compte bloqué (clé ou JWT) | `403` | `{ blocked: true, error: … }` |
| Autorité de session indisponible (révocation inconnue) | `503` | `{ error: "Authentication service unavailable." }` |
| Base injoignable pendant l'auth | `503` | `{ error: "Authentication service unavailable." }` |
| Aucune clé ni identité, route privée | `401` | `{ error: "Service Unavailable. API Key missing." }` |
| Quota hebdomadaire ou limite de clé épuisé | `429` | `{ code: "quota_exceeded" \| "api_key_limit_exceeded", … }` |
| Autorité de quota indisponible | `503` | `{ error: "Quota service unavailable. Please retry later." }` |

Sur une route **publique**, un quota épuisé **laisse passer** la requête au
niveau public, sans débit supplémentaire. Une indisponibilité du quota, elle,
ne fait jamais exécuter le handler.

### 4.3 Contexte posé sur le contexte Hono

```ts
c.set("userPlan", userPlan);
c.set("userId", currentUserId);
c.set("apiKey", currentApiKey);
c.set("matchedApiKey", matchedApiKey);
```

Plus `requestQuota` (objet) et le fanion `quotaDebitedByHandler` posé par les
handlers qui débitent eux-mêmes le coût complet (images).

### 4.4 Quota hebdomadaire — réservation atomique

- Somme de `request_count` sur **toutes** les clés du compte (résolues par la
  table `users`, pas par la seule chaîne `user_id`), plus
  `getUserQuotaBoost(userId, "api")`.
- Période hebdo (lundi 00:00 UTC) via `getWeekData()`.
- **La place est réservée AVANT le handler** (`api-quota.ts`, transaction +
  `pg_advisory_xact_lock` par compte). Deux requêtes simultanées à 9/10 ne
  peuvent pas consommer la même dernière place.
- Si le handler échoue (statut non-200) ou s'il débite lui-même le coût complet,
  la réservation est **rendue** (débit idempotent au niveau requête).
- Une erreur de lecture ou d'écriture de l'autorité de quota produit un **503**
  explicite et journalisé ; le fournisseur n'est jamais appelé.
- **Un JWT de session ne consomme pas ce quota**: le compteur n'est réservé que
  pour les clés enregistrées.

### 4.5 Journalisation après `next()`

```ts
INSERT INTO mprojects_api_logs (api_key, endpoint, method, status_code, latency_ms)
```

Exclut: `/v1/devices*`, `/v1/status`, `/status`. Le débit n'est **plus** fait
après le handler : il a été réservé avant, et seule la libération éventuelle y
figure. Les erreurs de journalisation sont loguées et **n'interrompent pas** la
réponse.

---

## 5. `config.ts` — forfaits, base, JWT

`config.ts` n'importe **aucun module local**: c'est la racine du graphe.

### 5.1 Forfaits

```ts
export type Tier = "Free" | "Plus" | "Pro" | "Max";
```

**Casse Title** côté backend, contre **minuscule** côté Next (`lib/auth/plan.ts`).
C'est une frontière de traduction, pas un oubli.

`normalizeTier` accepte les alias via `TIER_ALIASES` (`free`, `gratuit`, `plus`,
`pro`, `max`) et retombe sur `Free`.

Tables de limites, chacune avec son getter:

| Table | Getter | Rôle |
|---|---|---|
| `TIER_LIMITS` | `getTierMaiTokenLimit` | tokens mAI |
| `TIER_SPEECH_LIMITS` | `getTierSpeechLimit` | tokens speech |
| `TIER_REQUEST_LIMITS` | `getTierRequestLimit` | requêtes API / semaine |
| `TIER_DAILY_IMAGE_LIMITS` | `getTierDailyImageLimit` | images / jour |
| `TIER_IMAGE_REQUEST_COST` | `getTierImageRequestCost` | coût multi-crédits |
| `STORAGE_LIMITS_BYTES` | `getTierStorageLimitBytes` | stockage cloud cumulé |
| `MEDIA_UPLOAD_LIMITS_BYTES` | `getTierMediaUploadLimitBytes` | taille d'**un** envoi (`/upload-file`) |
| `TIER_DAILY_STORY_LIMITS` | `getTierDailyStoryLimit` | stories Vibe / jour (`null` = illimité) |

> **Il n'existe pas de `TIER_AGENT_LIMITS` côté backend.** Les bots vivent dans
> la base PostgreSQL de l'hôte Next; leur limite est `TIER_LIMITS.free.agents`
> dans `lib/plans/tier-limits.ts`, appliquée par la BFF
> `app/(chat)/api/agents/**` via `getTierAgentLimit`. Un test
> (`tests/unit/agents-quota-models.test.ts`) refuse d'ailleurs explicitement
> l'apparition de cette table dans `config.ts`: l'ajouter serait une deuxième
> source de vérité, pas un miroir.

> `STORAGE_LIMITS_BYTES` et `MEDIA_UPLOAD_LIMITS_BYTES` ne désignent pas la même
> grandeur: l'une borne le **total stocké** (10/20/40/60 Go), l'autre la taille
> d'**un seul fichier** envoyé. Les confondre est l'erreur classique.

> Ces tables sont le **miroir** de `lib/plans/tier-limits.ts` pour les grandeurs
> que l'hôte expose aussi. Toute évolution de forfait doit être répercutée des deux
> côtés, sinon l'interface annonce une limite que le backend n'applique pas (ou
> l'inverse). Le commentaire en tête de `lib/plans/tier-limits.ts` le rappelle.
> Les stories, elles, restent côté backend + Vibe: pas de `storiesPerDay` dans
> `lib/plans/tier-limits.ts`, car `/settings` n'affiche pas ce quota.

### 5.2 Base de données

`getDb()` renvoie un client `postgres` (Neon). `initSQLite()` initialise une base
SQLite séparée via `https://esm.town/v/std/sqlite`, utilisée par la plateforme
vibe. **Les deux coexistent**: le backend n'est pas sur une seule base.

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

La quasi-totalité des routes sont montées **deux à quatre fois**: avec et sans
le préfixe `/v1`, avec et sans slash final.

```
GET /v1/models · /models · /v1beta/models
```

C'est une compatibilité OpenAI / SDK d'Éditeurs. Le graphe réel est donc
nettement plus large que le nombre de handlers.

### 6.1 `auth.ts` (1 158 l.) — inscription et identité

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

Importe `maiModels.ts` (281 l.): le catalogue de modèles mAI.

### 6.4 `images.ts` (2 435 l.) — 52 handlers

| Domaine | Routes |
|---|---|
| Catalogue | `GET /v1/models/images`, `/v1/images/models`, `/models/images/:id` |
| Génération | `POST /v1/images/generations` |
| Quota | `GET /v1/images/usage` |
| Historique | `GET` / `PATCH` `/v1/images/history[/:id]` |
| Midjourney | `POST /mj/submit/{imagine,action,describe,blend}` · `GET /mj/task/:id/fetch` |

### 6.5 `audio.ts` (821 l.) — 45 handlers

| Domaine | Routes |
|---|---|
| Catalogues | `GET /v1/models/speech`, `/v1/audio/models`, `/v1/speech/voices` |
| Synthèse | `POST /v1/audio/speech` |
| Quota | `GET /v1/audio/usage`, `/v1/speech/usage` |
| Historique | `GET` / `PATCH` / `DELETE` `/v1/audio/history[/:id]` |

### 6.6 `web.ts` — recherche Web publique bornée

`GET|POST /v1/web/search` — recherche web, avec prise en compte des en-têtes
`x-web-search` et `x-disable-web-search`.

Le parcours anonyme est **documenté** (catalogue `requiresAuth: false`) et
conservé, mais borné côté serveur : requête ≤ 500 caractères, `count` ramené
dans [1, 10], corps ≤ 16 Ko, **30 recherches/min/IP** (60/min par compte
authentifié, compteur partagé SQLite), 6 recherches simultanées par isolate et
au plus 4 tentatives fournisseur par appel. Les appels You.com et les replis
ont un délai de 5–6 s. Le CORS `origin: "*"` n'est pas une authentification :
ces bornes s'appliquent aussi aux appels directs non navigateur.

### 6.7 `images.ts` — générations et tâches Midjourney

`/v1/images/generations`, `/images/*` et `/mj/*` (alias `/v1/mj/*`) partagent
les mêmes gardes : forfait payant, quota journalier d'images **réservé
atomiquement** avant le fournisseur, crédit API réservé à l'échelle du compte.
Les actions génératrices (`imagine`, `action`, `blend`, `change`, `modal`,
`swap-face`) consomment une image ; `describe` et `shorten` consomment le
fournisseur sans génération ; `task/:id/fetch` est une **lecture de statut**
sans débit.

Chaque tâche Midjourney est associée à son compte à la création
(`mprojects_image_tasks`, migration 0068). Une tâche inconnue, historique non
attribuée ou appartenant à un autre compte répond 404, sans révéler son
existence. Le corps des actions (`taskId`) est vérifié avant l'appel
fournisseur.

### 6.7 `projects.ts` (650 l.) — 12 handlers

`GET|POST /v1/projects` · `GET|PUT|DELETE /v1/projects/:id` ·
`GET /v1/projects/:id/stats`

### 6.8 `devices.ts` (153 l.) — 10 handlers

`GET /v1/devices` · `GET /userId` · `PUT|DELETE /v1/devices/:id` ·
`DELETE /v1/devices/others` · `DELETE /v1/devices/all`

Utilise aussi la base SQLite. Exclu de la journalisation de quota.

---

## 7. Vibe — la plateforme sociale

`vibe.ts` (53 l.) est un simple orchestrateur: il crée un `registerMulti` puis
monte 8 domaines.

### 7.1 Le motif `registerMulti`

`vibe-common.ts` expose `createRegisterMulti(app)`: une fonction qui enregistre
**un même handler sous plusieurs chemins**.

```ts
registerMulti("get", ["/api/vibe/feed", "/vibe/feed", "/v1/feed", "/feed"], handler);
```

Quatre alias: `/api/vibe/*`, `/vibe/*`, `/v1/*`, et parfois le chemin nu. Un
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

`vibe-users.ts` importe `storage.ts` et `vibe-circle.ts`: le social **réutilise
le registre de stockage de l'API principale**, pas une implémentation séparée.

### 7.3 DDL au chargement

Contrairement au Next.js, le backend **crée ses tables au montage**:

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

`main.ts` appelle `registerRealtimeRoutes` : le flux SSE est monté avec le graphe. `pushRealtimeEvent` écrit les événements que ce flux relit.

---

## 8. Index des modules backend

Le graphe ci-dessous est issu de l’inventaire local. Les alias HTTP sont comptés séparément; les chemins calculés restent explicitement signalés.

| Module | Lignes | Imports locaux |
| --- | ---: | --- |
| `api-context.ts` | 18 | |
| `api-middleware.ts` | 403 | `./config.ts`, `./openrouter-models.ts` |
| `audio.ts` | 821 | `./config.ts`, `./openrouter-models.ts` |
| `auth.ts` | 1158 | `./auth-resend-policy.ts`, `./config.ts`, `./email.ts`, `./vibe-common.ts` |
| `cli-env.ts` | 22 | |
| `config.ts` | 552 | `./api-context.ts` |
| `devices.ts` | 154 | `./config.ts` |
| `email.ts` | 553 | |
| `images.ts` | 2435 | `./api-quota.ts`, `./config.ts`, `./image-route-policy.ts` |
| `mai-identity.ts` | 143 | |
| `mai-translate.ts` | 375 | `./config.ts`, `./vibe-common.ts` |
| `maiModels.ts` | 339 | |
| `main.ts` | 153 | `./api-middleware.ts`, `./audio.ts`, `./auth.ts`, `./config.ts`, `./devices.ts`, `./images.ts`, `./mai-translate.ts`, `./models-cron.ts`, `./models.ts`, `./projects.ts`, `./realtime.ts`, `./storage.ts`, `./translate.ts`, `./vibe-ai.ts`, `./vibe.ts`, `./web.ts` |
| `models-cron.ts` | 20 | `./config.ts`, `./updateModels.ts` |
| `models.ts` | 846 | `./config.ts`, `./mai-identity.ts`, `./maiModels.ts`, `./openrouter-models.ts` |
| `openrouter-fetch.ts` | 38 | `./config.ts`, `./openrouter-models.ts` |
| `openrouter-models.ts` | 252 | |
| `projects.ts` | 633 | `./config.ts` |
| `realtime.ts` | 311 | `./config.ts`, `./vibe-common.ts` |
| `storage.ts` | 1005 | `./config.ts` |
| `translate.ts` | 460 | `./config.ts`, `./vibe-common.ts`, `./vibe-mai-fleet.ts` |
| `updateModels.ts` | 165 | `./cli-env.ts`, `./openrouter-models.ts` |
| `vibe-ai.ts` | 414 | `./config.ts`, `./vibe-common.ts`, `./vibe-mai-fleet.ts` |
| `vibe-books-conversations.ts` | 313 | `./vibe-dms-core.ts` |
| `vibe-books.ts` | 1116 | `./config.ts`, `./realtime.ts`, `./vibe-books-conversations.ts`, `./vibe-common.ts`, `./vibe-dms-core.ts`, `./vibe-posts-core.ts` |
| `vibe-circle.ts` | 236 | `./config.ts`, `./vibe-common.ts` |
| `vibe-common.ts` | 111 | `./config.ts` |
| `vibe-dms-conversations.ts` | 832 | `./config.ts`, `./realtime.ts`, `./vibe-books.ts`, `./vibe-common.ts`, `./vibe-dms-core.ts`, `./vibe-posts-core.ts` |
| `vibe-dms-core.ts` | 727 | `./config.ts`, `./openrouter-fetch.ts`, `./realtime.ts`, `./vibe-posts-core.ts` |
| `vibe-dms-groups.ts` | 568 | `./config.ts`, `./realtime.ts`, `./vibe-common.ts`, `./vibe-dms-core.ts` |
| `vibe-dms-message-actions.ts` | 682 | `./config.ts`, `./openrouter-fetch.ts`, `./vibe-common.ts`, `./vibe-dms-core.ts`, `./vibe-mai-fleet.ts` |
| `vibe-dms-moderation.ts` | 455 | `./config.ts`, `./realtime.ts`, `./vibe-common.ts`, `./vibe-dms-core.ts`, `./vibe-posts-core.ts` |
| `vibe-dms-notifications.ts` | 233 | `./config.ts`, `./vibe-common.ts` |
| `vibe-dms.ts` | 43 | `./vibe-common.ts`, `./vibe-dms-conversations.ts`, `./vibe-dms-core.ts`, `./vibe-dms-groups.ts`, `./vibe-dms-message-actions.ts`, `./vibe-dms-moderation.ts`, `./vibe-dms-notifications.ts` |
| `vibe-feed.ts` | 1000 | `./config.ts`, `./vibe-circle.ts`, `./vibe-common.ts`, `./vibe-posts-core.ts`, `./vibe-recommender.ts` |
| `vibe-mai-chat.ts` | 549 | `./config.ts`, `./openrouter-fetch.ts`, `./vibe-common.ts`, `./vibe-mai-core.ts`, `./vibe-mai-fleet.ts`, `./vibe-tools.ts` |
| `vibe-mai-conversations.ts` | 316 | `./config.ts`, `./vibe-common.ts`, `./vibe-mai-core.ts`, `./vibe-posts-core.ts` |
| `vibe-mai-core.ts` | 1143 | `./config.ts`, `./vibe-posts-core.ts` |
| `vibe-mai-creative.ts` | 322 | |
| `vibe-mai-execute.ts` | 471 | `./config.ts`, `./openrouter-fetch.ts`, `./vibe-common.ts`, `./vibe-mai-core.ts`, `./vibe-mai-fleet.ts`, `./vibe-tools.ts` |
| `vibe-mai-fleet.ts` | 1830 | `./config.ts`, `./openrouter-fetch.ts`, `./vibe-mai-creative.ts`, `./web.ts` |
| `vibe-mai-settings.ts` | 78 | `./config.ts`, `./vibe-common.ts`, `./vibe-mai-fleet.ts`, `./vibe-tools.ts` |
| `vibe-mai.ts` | 37 | `./vibe-common.ts`, `./vibe-mai-chat.ts`, `./vibe-mai-conversations.ts`, `./vibe-mai-core.ts`, `./vibe-mai-execute.ts`, `./vibe-mai-settings.ts` |
| `vibe-posts-core.ts` | 569 | `./config.ts` |
| `vibe-posts-crud.ts` | 1624 | `./config.ts`, `./realtime.ts`, `./vibe-books.ts`, `./vibe-circle.ts`, `./vibe-common.ts`, `./vibe-mai-fleet.ts`, `./vibe-posts-core.ts` |
| `vibe-posts-engage.ts` | 1161 | `./config.ts`, `./realtime.ts`, `./vibe-circle.ts`, `./vibe-common.ts`, `./vibe-dms.ts`, `./vibe-mai-fleet.ts`, `./vibe-mai.ts`, `./vibe-posts-core.ts` |
| `vibe-posts.ts` | 49 | `./vibe-common.ts`, `./vibe-feed.ts`, `./vibe-posts-core.ts`, `./vibe-posts-crud.ts`, `./vibe-posts-engage.ts` |
| `vibe-recommender.ts` | 277 | |
| `vibe-settings.ts` | 483 | `./config.ts`, `./vibe-common.ts`, `./vibe-tools.ts` |
| `vibe-tools.ts` | 709 | `./config.ts`, `./vibe-mai-fleet.ts` |
| `vibe-users.ts` | 1481 | `./config.ts`, `./storage.ts`, `./vibe-circle.ts`, `./vibe-common.ts`, `./vibe-posts-core.ts` |
| `vibe.ts` | 54 | `./vibe-books.ts`, `./vibe-circle.ts`, `./vibe-common.ts`, `./vibe-dms.ts`, `./vibe-feed.ts`, `./vibe-mai-fleet.ts`, `./vibe-mai.ts`, `./vibe-posts.ts`, `./vibe-recommender.ts`, `./vibe-settings.ts`, `./vibe-users.ts` |
| `web.ts` | 445 | |

## 9. Code mort et pièges connus

Relevés par analyse statique du graphe. À relire avant toute cleanup, pour ne
pas « corriger» du code qui est en réalité monté.

### 9.1 `vibe-ai.ts` — monté depuis `main.ts`

`registerVibeAIRoutes` est appelé par `main.ts`, juste après
`registerRealtimeRoutes`. Le module fait partie du graphe déployé :
`/v1/ai/text` et `/v1/ai/translate` ne sont pas du code mort.

### 9.2 `registerRealtimeRoutes` — montée depuis `main.ts`

`realtime.ts` définit le flux SSE (heartbeat, timeout `HEARTBEAT_TICKS = 15`,
purge `UNREAD_TICKS = 30`, `NOTIF_POLL_TICKS = 2`,
`MAX_CONNECTIONS_PER_USER = 2`, rattrapage des événements émis dans les 3 s
précédant la connexion). `main.ts` appelle `registerRealtimeRoutes`.
`pushRealtimeEvent` écrit des événements que ce flux relit. Ne pas retirer
l'appel en croyant le registre orphelin.

### 9.3 Fil monté une seule fois

`vibe.ts` appelle `registerVibeFeedRoutes` **avant** `registerVibePostsRoutes`.
L'ordre est obligatoire : la route statique `/v1/posts/top` (fil) doit primer
sur `/v1/posts/:id` (posts). `vibe-posts.ts` ne remonte plus le fil ; il
réexporte seulement `registerVibeFeedRoutes`. Le fanion
`__vibe_feed_registered` dans `vibe-feed.ts` reste une garde si un second
appel réapparaît.

### 9.4 `0014_notifications_and_memory.sql` — orphelin assumé, et non un absent

Le fichier **existe** dans `lib/db/migrations/` (suivi par git): il n'est
simplement pas journalisé, et c'est voulu. Sa contrainte `CHECK` énumère sept types
de notification, alors que `lib/db/migrate.ts` pose la même contrainte avec douze
types en étape de réparation exécutée **avant** les migrations Drizzle. La rendre
au journal la ferait passer **après**, donc la **rétrécir** — et les notifications
d'Agent (`agent_run_finished`, `agent_approval_required`…) seraient refusées en
base.

La liste de ces orphelins assumés vit dans
`tests/unit/migrations-journal.test.ts` (`ORPHINS_CONNUS`): c'est un aveu de
dette, pas une tolérance. Un `.sql` sans entrée de journal reste un **no-op
silencieux** (AGENTS.md §6.1) — ne jamais « réparer» l'un de ces fichiers sans
relire ce paragraphe.

`01_skills_mcp_marketplace.sql`, lui, a été **supprimé**: ses quatre tables sont
créées par les migrations journalisées `0006` (`SkillTemplate`, `McpTemplate`) et
`0012` (`SkillVersion`, `SkillUsage`). C'était un doublon mort hérité de la 0.5.0,
dont la seule présence faisait croire à une migration en attente.

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

Handlers: `{ error: string }`. C'est un format **différent** de celui du BFF Next
(`{ code, message, status, details? }`, voir `lib/api/error-response.ts`), que
`normalizeUpstreamError` se charge de traduire.

### 10.2 Limites par forfait

Quotas définis en double pour les grandeurs que les deux runtimes possèdent (voir [5.1](#51-forfaits)). Points d'application:

| Quota | Appliqué dans |
|---|---|
| Tokens mAI | `models.ts`, `lib/agent/budget` côté Next |
| Tokens speech | `audio.ts` |
| Requêtes API / semaine | `api-middleware.ts` (uniquement clés enregistrées) |
| Images / jour | `images.ts`, et `vibe-mai-fleet.ts` pour la flotte MAI de Vibe |
| Coût multi-crédits image | `images.ts`, via `quotaDebitedByHandler` |
| Stockage cloud cumulé | `storage.ts` (`/cloud/upload`), via `getTierStorageLimitBytes` |
| Taille d'un envoi média | `storage.ts` (`/upload-file`), via `getTierMediaUploadLimitBytes` |
| Stories / jour (Vibe) | `vibe-stories.ts`, via `getTierDailyStoryLimit` |

**Les bots n'ont pas de quota backend.** Le nombre de bots n'est limité que par la
BFF Next `app/(chat)/api/agents/**` (8 en Free), et `vibe-mai-fleet.ts` n'en traite
pas: il applique les limites d'images et de tokens de la flotte MAI du réseau
social. Voir l'avertissement de [5.1](#51-forfaits) sur `TIER_AGENT_LIMITS`, qui
n'existe pas.

**Deux plafonds média distincts**: `getTierStorageLimitBytes` borne le total
stocké, `getTierMediaUploadLimitBytes` la taille d'un seul envoi. La borne des
stories (50 Mo, tous forfaits) est un troisième contrat, indépendant des deux et
recontrôlé dans `vibe-stories.ts` — sans quoi un compte Max publierait une story
d'un gigaoctet en passant par `/upload-file`.

Un niveau d'images, un niveau de parole et un niveau de stockage par compte
sont aussi contrôlés côté Next via `lib/plans/tier-limits.ts`, qui lit les
quotas renvoyés par l'API plutôt que de les recalculer. Les stories, elles, ne
remontent pas dans `lib/plans/tier-limits.ts`: `/settings` n'affiche pas ce quota.

---

## Voir aussi

- `AGENTS.md` — dépôt, stack, conventions, migrations
- `docs/1-web/AGENT_ENGINE.md` — l'espace Agent (exécution, budgets, outils)
- `docs/1-web/AI_AGENTS_API.md` — API publique pour agents externes
- `docs/plugins-public-apis.md` — API HTTP tierless utilisées par les plugins
