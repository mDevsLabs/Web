# Wakies — intégration sous `/wakies`

Wakies est une application autonome (ex-« OpenDots », un gabarit
auto-hébergeable CopilotKit). Elle est portée dans mAI Web sous `/wakies`,
comme Vibe sous `/vibe`, mais avec une difficulté supplémentaire : **la
reconnexion, les migrations, la recherche Web, les réponses IA et les quotas
sont repris de l'hôte**, et non recréés.

Ce document est la carte du port : ce qui est porté, ce qui ne l'est pas
(encore), et pourquoi.

---

## 1. Pourquoi ce n'est pas un simple « on copie les fichiers »

Le gabarit d'origine (`apps/wakies/`) était **mono-utilisateur et
auto-hébergé** :

| Dans le gabarit | Dans mAI Web |
|---|---|
| `OWNER_TOKEN` bearer, saisi à la main, en `sessionStorage` | session mAI (cookie httpOnly), aucune saisie |
| deux bases SQLite (`Store`, `WorkspaceStore`) | PostgreSQL, tables `Wakies*` |
| CopilotKit Intelligence pour les conversations | pipeline de chat mAI (modèle, outils, quotas) |
| Parallel (MCP) ou navigateur isolé pour le Web | `/v1/web/search` via l'outillage de l'hôte |
| `setInterval` dans le process Node pour les tâches | route cron `/api/cron/wakies` |
| Slack (Channels SDK), OpenBot (ordinateurs), OpenAI Realtime (voix) | non branchés — déclarés, voir § 6 |

Un compte mAI = un espace de travail Wakies. **Toutes** les lignes des tables
`Wakies*` portent `userId`, et aucune requête ne lit sans lui.

---

## 2. Arborescence

```
app/
├── (wakies)/wakies/            page + layout /wakies (plein écran)
├── (chat)/api/wakies/**        BFF : état, espaces, wakies, conversations,
│                               messages, pages, tâches, mémoires, chat
└── api/cron/wakies/            tick des tâches planifiées

components/wakies/              interface portée (35 fichiers)
├── workspace-app.tsx           ancienne App.tsx : coquille et navigation
├── Chat.tsx                    réécrit sur `useChat` (AI SDK)
├── ChatTranscript.tsx          réécrit sur `UIMessage` + Streamdown
├── ThreadList.tsx              réécrit sans `useThreads`
├── api.ts                      client BFF (plus de jeton)
├── markdown.tsx                Markdown via Streamdown (le moteur de l'hôte)
├── wakies.css                  GÉNÉRÉ
└── wakies-editor.css           GÉNÉRÉ

lib/wakies/
├── queries.ts                  accès PostgreSQL, scopé par compte
├── http.ts                     identité, erreurs, quotas
├── setup.ts                    ce qui est réellement branché
├── onboarding.ts               espace et Wakie de départ
├── serialize.ts                Date → millisecondes pour l'interface
├── pages.ts                    schémas de validation des pages
└── shared/                     types partagés (portés)

apps/wakies/                    source Vite d'origine, conservée en référence
scripts/build-wakies-css.mjs    génère les deux feuilles de style
scripts/rewrite-wakies-imports.mjs  ponctuel : imports → alias
```

## 3. Renommage

`OpenDots` → **Wakies**, `Dot` → **Wakie**, jusque dans les variables, les
tables, les chemins d'API (`/api/dots` → `/api/wakies`) et les fichiers
(`dot-agent.ts` → `wakie-agent.ts`).

Trois tokens sont **conservés** parce qu'ils décrivent un point graphique, pas
l'agent : `.dot-body` (corps de la mascotte), `.online-dot`,
`.call-live-dot`, `.wordmark-dot`, `.dotted-logo`. Les aurait renommés, on
aurait perdu le sens de la feuille de style.

De même, `threadId` a disparu : les « threads » étaient ceux d'Intelligence.
Ce sont des `conversations`, et la colonne s'appelle comme ça.

---

## 4. Ce que l'hôte fournit, et où c'est branché

| Besoin | Branchement | Fichier |
|---|---|---|
| Compte / session | `getMaiUser()` | `lib/wakies/http.ts` |
| Quotas weekly (tokens) | `weeklyQuotaExceeded` + `recordTokenUsage` | `app/(chat)/api/wakies/chat/route.ts` |
| Quotas volumétriques | `TIER_LIMITS.wakies` | `lib/plans/tier-limits.ts` |
| Rate limit IP | `enforceChatRateLimit` | idem |
| Modèle | `getLanguageModel(DEFAULT_CHAT_MODEL, { sessionToken })` | idem |
| Recherche Web | outil `webSearch` (API mAI + repli DDG/Searx) | idem |
| Persistance | `WakiesMessage` (parties UI conservées telles quelles) | idem |

Un message envoyé à un Wakie consomme **le même quota hebdomadaire** qu'un
message du chat principal. Il n'existe pas de quota parallèle Wakies : ce
serait l'illusion d'un volume infini.

---

## 5. Feuille de style

`components/wakies/wakies.css` et `wakies-editor.css` sont **générés** par
`node scripts/build-wakies-css.mjs`. Chaque sélecteur de la source est
re-ancré sous `.wakies-root` : sans cela, le thème clair de Wakies (`:root` →
fond `#f8f7f4`) et ses sélecteurs nus (`button`, `input`, `.sidebar`)
repeindraient le chat et la barre latérale de mAI.

Le script **échoue** (code 1) plutôt que d'écrire une feuille partielle : une
règle non ancrée, un sélecteur `html`/`body` résiduel ou une source manquante
sont signalés, et rien n'est écrit.

> Wakies n'utilise **ni Tailwind ni thème sombre** : pas de variante
> `wakies-dark` à declaring dans `app/globals.css` (contrairement à Vibe).

### Navigation

Wakies est en **plein écran** et vit dans son propre groupe de routes
(`app/(wakies)/wakies`) : son rail et sa barre latérale sont en
`position: fixed`, et le layout `(chat)` aurait superposé deux navigation. La
session reste protégée par `proxy.ts`, qui couvre toutes les routes.

Les espaces et pages s'adressent par **fragment** (`/wakies#/spaces/…/pages/…`),
convention conservée du gabarit. Le serveur ne voit que `/wakies`, donc aucun
deep-link à réécrire — mais l'URL n'est pas partageable côté serveur.

---

## 6. Fonctions non encore branchées

Elles sont **portées** (le code est là, typé, linté) mais sans service
derrière : l'interface le dit au lieu d'échouer au milieu d'une action.

| Fonction | Manque | État de la donnée |
|---|---|---|
| Voix temps réel (OpenAI Realtime) | route `/voice/calls` + passerelle audio | `WakiesCall` prête |
| Ordinateurs persistants (OpenBot) | superviseur + panneau Ordinateurs déjà rendu | pas de table |
| Slack (Channels SDK) | canal géré | — |
| « Approuver et enregistrer » (HITL) | outil d'approbation AI SDK | `WakiesPageReview` prête |

`WakiesSetup` (`lib/wakies/setup.ts`) décrit ce point à l'interface : c'est
lui qui remplace l'ancien écran de configuration par variables
d'environnement.

---

## 7. Tâches planifiées

`GET /api/cron/wakies` ( authentifié par `CRON_SECRET`, comme
`/api/cron/agent`) :

1. découvre les comptes ayant au moins un Wakie ;
2. réserve une tâche due par transaction (bail de 3 minutes) — deux ticks
   concurrents ne peuvent pas exécuter la même tâche ;
3. exécute le tour **dans la conversation liée** et y écrit le résultat
   comme message ;
4. reprogramme la prochaine exécution si la tâche est récurrente.

À configurer dans `vercel.json` (ou le planificateur de l'hôte), sinon rien
ne se déclenche tout seul.

---

## 8. Commandes

```bash
node scripts/build-wakies-css.mjs      # régénère les deux feuilles
node scripts/rewrite-wakies-imports.mjs  # ponctuel, après un nouveau port
pnpm typecheck
pnpm test:unit
```

## 9. Points ouverts

- **Traduction** : la coquille, le chat, les réglages et les pages de sortie
  sont en français ; quelques libellés du code porté (éléments de liste,
  messages d'erreur de l'éditeur, aide du navigateur d'ordinateurs) sont
  encore en anglais.
- **Double navigation** : `/vibe` garde la barre latérale mAI et celle de
  Vibe ; `/wakies` est en plein écran, donc une seule navigation — choix
  assumé, à revoir si l'on veut revenir à une barre latérale commune.
- **Taille du HTML** : le port de Vibe produit ~1,2 Mo de HTML par page ;
  `/wakies` devrait être plus léger, à mesurer.