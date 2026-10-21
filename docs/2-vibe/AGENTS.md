# Directives & Règles pour Agents IA — Vibe Social (`2-vibe`)

Ce document contient les règles fondamentales et les consignes de développement à respecter impérativement lors de modifications concernant la plateforme sociale **Vibe** (que ce soit dans `apps/vibe/` ou dans son portage `components/vibe/`, `lib/vibe/`, `app/(chat)/vibe/`).

---

## 1. Les Trois Règles d'Or du Portage

### Règle n° 1 — Deux sorties de script ne s'éditent jamais manuellement
| Fichier | Produit par | Règle |
|---|---|---|
| `components/vibe/vibe.css` | `node scripts/build-vibe-css.mjs` | **NE JAMAIS ÉDITER**. Source: `apps/vibe/src/index.css`. Le script ré-ancre l'AST PostCSS sous `.vibe-root`. |
| `app/(chat)/vibe/**/page.tsx` | `node scripts/build-vibe-routes.mjs` | **NE JAMAIS ÉDITER**. Source: table `ROUTES` dans `scripts/build-vibe-routes.mjs`. |

> [!NOTE]
> En revanche, `components/vibe/pages/vibe-routes.tsx` **n'est pas généré**: c'est le fichier des adaptateurs entre la navigation par props de Vibe et le routeur de l'hôte mAI.

### Règle n° 2 — Tout Vibe vit strictement sous `.vibe-root`
`lib/vibe/context/ThemeContext.tsx` enveloppe l'application dans `<div class="vibe-root">`. Le thème est posé sur ce conteneur, jamais sur `<html>`.
- Les classes Tailwind dépendant du thème s'écrivent **`vibe-dark:`** (déclaré dans `app/globals.css`), **jamais `dark:`** (qui suit `<html>` et allumerait le mode sombre dans Vibe dès que l'hôte mAI est sombre).
- Aucune règle CSS ne doit déborder hors de `.vibe-root` afin de préserver la palette achromatique de l'hôte.

### Règle n° 3 — Toutes les URLs passent par `components/vibe/router.tsx`
- Utiliser impérativement `toVibePath()` pour générer des liens internes (`/vibe/...`).
- Utiliser `stripVibeBasePath()` pour les comparaisons dans les composants (`location.pathname === '/'`).
- Utiliser `toVibeAbsoluteUrl()` pour les partages externes, invitations et QR codes.
- Les profils utilisent `/vibe/@pseudo`, réécrits de manière transparente vers `/vibe/u/[username]` par `next.config.ts`.

---

## 2. Particularités Lint & Conventions

`biome.jsonc` définit deux exceptions indispensables au bon fonctionnement de Vibe:
1. **`useExhaustiveDependencies` assoupli**: Dans Vibe, plusieurs tableaux de dépendances sont des déclencheurs volontaires (`[post.id, post.poll]` pour forcer la synchronisation, `[nonce]` pour rafraîchir). Ne pas les supprimer.
2. **`useSortedKeys` désactivé sur `lib/vibe/context/ThemeContext.tsx`**: L'ordre des clés des 5 tables de réglages (thèmes de bulles, fonds, formes, palettes d'accent, tailles de texte) dicte l'ordre d'affichage des boutons dans l'interface. Trier ces clés altère l'UI.

---

## 3. Application Mobile (Capacitor)

- La configuration mobile se trouve dans `apps/vibe/capacitor.config.ts`.
- L'URL distante chargée par la WebView est paramétrée par `VIBE_WEB_URL` (défaut: `https://mai-officiel.vercel.app/vibe`, le portage dans l'hôte mAI).
- Les builds Android/iOS et leurs releases sont intégrés dans `.github/workflows/build.yml`.

---

## 4. Données: lectures pré-hydratées, écritures API

Les lectures de premier écran sont servies par `lib/vibe/server/` (Postgres
direct, `DATABASE_URL` partagé avec le backend); les **écritures, l'IA et le
SSE restent sur l'API** `mai.val.run`. Details et contrats:
`docs/2-vibe/INTEGRATION.md` § 7bis. Points d'attention pour un agent:

- Une page `app/(chat)/vibe/**` est **générée**: le gabarit async vit dans
  `scripts/build-vibe-routes.mjs` (clé `cle` de la table `ROUTES`); la graine
  transite par `getVibeHydration()` → `vibe-routes.tsx` → prop `hydration`.
- Les lecteurs (`lib/vibe/server/queries/*`) sont des **répliques lecture
  seule** des handlers backend, alias snake_case et clauses de visibilité
  compris — jamais de DDL, jamais d'écriture; toute erreur ⇒ graine `null`
  ⇒ repli API automatique.
- Injecter une donnée en base dans le cache client passe exclusivement par
  `ApiService.seedEndpointFor`/`profileEndpoint`/`feedEndpoint`: une clé qui
  diverge du getter re-déclenche l'appel API supprimé, silencieusement.
- Suppression de routes backend: un handler ne meurt que si NI le portage NI
  `apps/vibe/src` (app mobile) ne l'appellent, et la suppression s'applique
  aux **deux copies** (`vibe-*.ts` racine et `scripts/vibe-*.ts`, identiques
  au byte près).

---

## 5. Stories: contrats à ne pas casser

Guide complet: [STORIES.md](./STORIES.md). Ce qui engage une modification:

- **Les tables Vibe ne sont pas dans Drizzle.** Le DDL des stories vit à deux
  endroits qui doivent décrire la même structure: `ensureStoriesTables()` dans
  `vibe-stories.ts` et `apps/vibe/lib/db/migrations/026_vibe_stories.sql`. Le
  migrateur Vibe vérifie les sommes de contrôle: une migration appliquée ne se
  retouche pas, elle se remplace par une `027`.
- **Deux plafonds média différents, en sens inverse.** Upload `/v1/upload-file`:
  50 Mo en Free, 1 Go en Plus/Pro/Max (`MEDIA_UPLOAD_LIMITS_BYTES`). Média d'une
  story: **50 Mo quel que soit le forfait** (`STORY_MEDIA_MAX_BYTES`). Les
  « réaligner» l'un sur l'autre casse un des deux contrats. Le contrôle de la
  story se fait par `HEAD` sur l'objet, jamais sur la taille déclarée par le
  navigateur.
- **Origine des médias.** Seules les origines du pool (`getStorageNodes()`) et le
  namespace `uploads/` sont acceptés, comparés sur `URL.origin` — un `startsWith`
  sur une URL se contourne avec un hôte fabriqué.
- **Le quota se renouvelle à minuit heure de Paris**, par une clé de jour calculée
  dans le module (`Intl`, `Europe/Paris`) et passée à l'upsert. `CURRENT_DATE` est
  UTC: l'utiliser remettrait le compteur à 1 h ou 2 h du matin. La divergence avec
  le quota d'images (UTC) est délibérée.
- **Forme des erreurs Vibe.** `error` est une chaîne, les champs machine sont à
  plat: `ApiService` fabrique `new Error(errJson.error)`, un objet imbriqué
  s'affiche « [object Object]».
- **L'anneau est une coque externe.** `ProfileAvatar` ne reçoit aucune prop
  d'anneau (une vingtaine de sites de rendu, un jumeau dans `apps/vibe/src` aux
  imports différents). États portés par `data-live` / `data-seen`, jamais par des
  classes conditionnelles. Styles dans `apps/vibe/src/index.css`, puis
  `node scripts/build-vibe-css.mjs`.
- **Le rail n'est pas pré-hydraté**: le gabarit de page n'admet qu'une graine par
  route, celle du fil est prise. Ne pas ajouter une clé `stories` au registre
  d'hydratation sans page qui la consomme.
- **Le portail du lecteur se rend dans `.vibe-root`**, pas dans `document.body`:
  sinon il perd les tokens de thème du conteneur.

## 4bis. Notifications: la décision est dans les paramètres mAI

Les préférences de notification Vibe (e-mail, push, j'aime, partages, réponses,
messages privés) sont réglées dans **l'onglet « Notifications» des paramètres
mAI**, qui regroupe mAI, Vibe et Wakies. Elles ne sont PLUS dans les paramètres
Vibe: deux endroits pour la même décision feraient que le dernier enregistré
gagnerait, et la case affichée ne serait pas celle qui compte.

Ce qui reste dans les paramètres Vibe: le **retour haptique** et les
**animations**. Ce sont des réglages d'**appareil**, pas de compte — ils ne se
synchronisent pas entre deux machines.

Conséquences techniques:

- `user_settings` reste la source de vérité Vibe. Le backend applique un
  `CASE WHEN … IS NOT NULL` sur les colonnes de notification: **les omettre**
  conserve les valeurs, les envoyer à `true` les écrase. Un écran qui gère
  d'autres réglages Vibe ne doit donc pas envoyer ces colonnes.
- La table `notifications` de Vibe reste la source des **événements**. Elle est
  lue par le tick de réplication (`app/api/cron/notifications`) et par la page
  Vibe des notifications; l'état lu de l'hôte est répliqué **depuis** elle,
  jamais l'inverse.
- Le pont d'identité entre l'hôte et Vibe est l'**email**: l'hôte identifie un
  compte par une chaîne (`users.id` ou email), Vibe par un **entier**. Aucun
  identifiant n'est commun.

## 5bis. Ajouter un outil IA mAI

Le catalogue des outils est dupliqué en **trois endroits**, et le dépôt ne
comporte **aucun script de génération**: les trois copies dérivent.

| Copie | Rôle | Qui la lit |
|---|---|---|
| `vibe-tools.ts` (racine) | **déployée** sur Val Town | `GET /v1/mai/tools`, exécution |
| `apps/vibe/lib/tools/index.json` | référence | `apps/vibe/lib/tools/index.ts` |
| `lib/vibe/data/maiTools.ts` | repli client | `MaiToolChips`, `useAvailableMAITools` |

Un outil se déclare à **six endroits**:

1. **`vibe-tools.ts`** — entrée dans `MAI_TOOLS_CATALOG` (id, nom, commande
   slash, mention, description, `icon_name`, `category`, `sensitive`,
   `enabled`) **et** dans `TOOL_EXECUTORS`. Bump de `MAI_CATALOG_VERSION`.
2. **`vibe-mai-creative.ts`** (ou `vibe-mai-fleet.ts` pour un outil purely
   SQL) — le corps de l'outil. Les outils d'écriture et d'analyse vivent dans
   `vibe-mai-creative.ts`: Val Town impose une limite de taille de fichier
   et la flotte approchait de la sienne.
3. **`vibe-mai-core.ts`** — une branche dans `detectTool()` (reconnaissance
   `/cmd` et `@mention`) **et** une branche dans `formatToolReply()` (sinon
   la réponse est le générique « Action effectuée.»).
4. **`lib/vibe/data/maiTools.ts`** — l'entrée de repli, avec son
   `samplePrompt`: sans elle, `MaiToolChips` affiche l'id brut et la bande
   d'outils rapides n'envoie qu'une commande vide.
5. **`components/vibe/layout/ToolAutocomplete.tsx`** — l'`icon_name` doit
   exister dans `iconMap` (et dans son jumeau `apps/vibe/src/…`), sinon
   l'icône tombe sur le repli `Sparkles`.
6. **`apps/vibe/lib/tools/`** — le fichier dédié + son enregistrement dans
   `index.ts` et `tools.ts` (copie de référence, non compilée par Next).

### Pièges

- **`sensitive` est double**: le drapeau du catalogue ne sert qu'à
  l'interface (badge). Le **seul** gardien de l'approbation est
  `SENSITIVE_TOOLS` (`vibe-mai-fleet.ts`). Un outil marqué sensible dans le
  catalogue mais absent de cette liste s'exécute **sans** accord.
- **L'ordre de `detectTool()` compte**: un préfixe plus court placé avant
  capture le plus long (`/compare` avant `/comparer`, `/analyze` avant
  `/analyze_stats`).
- **Les outils n'utilisent pas de function-calling**: le modèle ne choisit
  jamais l'outil. Un outil n'est atteignable que par un préfixe `/` ou `@`.
- **Le quota est débité à plat** (250 tokens par exécution), quel que soit
  le coût réel de l'outil.

## 6. Réseau: le relais BFF `/api/vibe/**`

Vibe ne joint plus l'API mAI en direct. Tout passe par le relais BFF de l'hôte
(`app/(chat)/api/vibe/[...path]/route.ts`), qui lit le cookie httpOnly
`mai_session_token` et pose l'`Authorization` vers l'amont. Détail complet:
[INTEGRATION.md](INTEGRATION.md) § 7.

- **Ne jamais poser d'`Authorization` côté client sur un appel relayé.** Le
  relais s'authentifie par le cookie; un en-tête `Bearer` poserait l'identité
  d'un jeton Vibe sur la session de l'hôte. `lib/vibe/services/api/base.ts`
  ne le pose que sur les endpoints d'authentification Vibe, qui restent en
  accès direct.
- **Un nouveau endpoint Vibe doit être ajouté à la liste blanche** de
  `lib/vibe/server/relay-policy.ts`. Un chemin absent de la liste est refusé
  en 404: c'est volontaire, pas un oubli.
- **La décision de chemin se prend sur le chemin BRUT**
  (`request.nextUrl.pathname`), jamais sur `params.path`: Next décode les
  segments avant de les livrer, donc `%2F` y serait déjà redevenu `/` et la
  garde de traversée serait franchie avant d'être appliquée.
- **L'authentification Vibe est hors relais** (`/login`, `/register`,
  `/verify-*`, `/resend-code`): elle est pilotée par les Server Actions de
  l'hôte, qui posent le cookie de session.
- **Le SSE passe par le relais sans délai d'attente.** Lui appliquer le délai
  d'attente des autres routes figerait la messagerie temps réel. Le jeton ne
  part plus en query string.
- **`apps/vibe/src/services/api.ts` reste inchangé**: c'est la source Vite de
  référence, hors build Next. Elle conserve l'accès direct.
