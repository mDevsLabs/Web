# Matrice de validation transversale

Couverture des interactions critiques des trois lots : fiabilisation de l'accès
Agent (source de vérité `users.tier`), tool natif de photo de profil, et
workflow Vercel. Chaque ligne indique où le comportement est vérifié
(automatiquement par un test, ou manuellement en revue/CI).

## Légende

- **Unitaire** : test Vitest (`pnpm test:unit`) — aucun réseau, aucune base réelle.
- **Typecheck** : `pnpm typecheck` (tsc --noEmit).
- **Lint** : `pnpm check` (Ultracite/Biome) — hors diagnostics préexistants.
- **Build** : `pnpm build` (Next).
- **Revue** : vérifié par revue de code / contrainte d'architecture.

## Accès Agent — plan d'abonnement

| # | Interaction critique | Vérification | Où |
|---|----------------------|--------------|----|
| 1 | Le plan est déterminé depuis `users.tier` pour la ligne dont `users.id` correspond | Unitaire | `tests/unit/db-users.test.ts` |
| 2 | Un utilisateur Plus valide possède effectivement l'accès Agent (bug historique) | Unitaire | `tests/unit/agent-gate.test.ts` + `tests/unit/chat-auth.test.ts` |
| 3 | « Salut ! » en Agent pour un Plus autorisé : conversation + AgentRun créés | Revue (route) + e2e existant | `app/(chat)/api/agent/route.ts` ; `tests/e2e/agent.test.ts` |
| 4 | Une valeur tier envoyée ou manipulée côté client ne peut jamais donner accès | Unitaire | `tests/unit/chat-auth.test.ts` (tier JWT obsolète écrasé par la DB) |
| 5 | Un tier invalide ou inconnu n'accorde aucun privilège supplémentaire | Unitaire | `tests/unit/db-users.test.ts`, `tests/unit/agent-budget.test.ts` |
| 6 | Plus s'arrête à 1 h, Pro à 3 h, Max sans plafond produit | Unitaire | `tests/unit/agent-budget.test.ts` |
| 7 | Les contrôles de durée utilisent la même source de vérité que l'accès Agent | Unitaire | `tests/unit/agent-budget.test.ts` (test de cohérence) |
| 8 | Tous les forfaits conservent des timeouts techniques individuels | Unitaire | `tests/unit/agent-budget.test.ts` (budget technique 240 s) |
| 9 | `auth_required`, `plan_required`, `access_denied`, `model_access_denied`, `not_found` restent différenciés | Unitaire + Typecheck | `tests/unit/agent-gate.test.ts` ; `lib/api/error-codes.ts` |
| 10 | Utilisateur absent de `users` → refus explicite et sûr (missing) | Unitaire | `tests/unit/db-users.test.ts`, `tests/unit/chat-auth.test.ts` |
| 11 | Tier inconnu/invalide → refus explicite (invalid), aucun repli silencieux | Unitaire | `tests/unit/db-users.test.ts` |
| 12 | Session absente → `auth_required` (unauthorized) sans lecture DB | Unitaire | `tests/unit/chat-auth.test.ts` |
| 13 | Plus accédant à la conversation d'un autre utilisateur → refus | Revue (queries existantes par `userId`) | `lib/db/queries.ts` |
| 14 | Plus utilisant un projet étranger → refus | Revue | `lib/db/queries.ts` |
| 15 | Modèle non couvert par le forfait → erreur modèle, pas faux `plan_required` | Unitaire | `tests/unit/agent-gate.test.ts` (checkAgentModelAccess) |
| 16 | Changement de tier persisté pris en compte (cache 60 s + invalidation) | Unitaire | `tests/unit/db-users.test.ts` (cache + invalidation) |

## Photo de profil (tool natif)

| # | Interaction critique | Vérification | Où |
|---|----------------------|--------------|----|
| 17 | Le tool exige une source validée et une confirmation | Unitaire | `tests/unit/update-profile-picture.test.ts` |
| 18 | Pièce jointe : URL du pipeline d'upload uniquement (allow-list Blob) | Unitaire | `tests/unit/update-profile-picture.test.ts` |
| 19 | URL distante : HTTPS strict, hôtes privés/localhost/IP littéraux refusés | Unitaire | `tests/unit/fetch-image.test.ts` |
| 20 | SSRF : redirections revalidées, max 3 sauts, schémas non-HTTP refusés | Unitaire | `tests/unit/fetch-image.test.ts` |
| 21 | MIME réellement autorisés (magic bytes) : SVG et contenus actifs refusés | Unitaire | `tests/unit/fetch-image.test.ts` |
| 22 | Limites : taille 10 Mo, timeout 8 s, redirections bornées | Unitaire | `tests/unit/fetch-image.test.ts` |
| 23 | Confirmation ancrée sur la source exacte (hash) : toute modification exige une nouvelle confirmation | Unitaire | `tests/unit/update-profile-picture.test.ts` |
| 24 | Cancellation / erreur amont → état explicite, jamais « avatar changé » | Unitaire | `tests/unit/update-profile-picture.test.ts` (statuts) |
| 25 | Invalidation du cache settings/session après succès | Revue | `app/(chat)/api/settings/route.ts`, `lib/auth/session.ts` |
| 26 | Disponible en Chat et en Agent (registres `TOOL_IDS`/`TOOLS_META`/`TOOL_SYSTEM_HINTS`, `createChatTools`) | Typecheck + Build | `lib/ai/tools/config.ts`, `lib/chat/tools.ts` |
| 27 | Aucun cookie/token utilisateur transmis au domaine distant | Unitaire | `tests/unit/fetch-image.test.ts` (en-têtes de la requête) |
| 28 | Le serveur rejette un modèle incompatible même si le client est modifié | Unitaire | `tests/unit/agent-gate.test.ts` (checkAgentModelAccess) |

## Workflow Vercel

| # | Interaction critique | Vérification | Où |
|---|----------------------|--------------|----|
| 29 | Typecheck retiré du workflow de déploiement, conservé en commande locale/CI | Revue | `.github/workflows/deploy-vercel.yml` |
| 30 | Migration puis `vercel build` dans une seule étape, chaînées (arrêt si échec) | Revue | `.github/workflows/deploy-vercel.yml` |
| 31 | `vercel pull` avant l'étape fusionnée (environnement Vercel disponible) | Revue | `.github/workflows/deploy-vercel.yml` |
| 32 | `DATABASE_URL`/`POSTGRES_URL` uniquement dans l'étape migration/build | Revue | `.github/workflows/deploy-vercel.yml` |
| 33 | Distinction production (`main`) / preview conservée ; pas de `--prebuilt` mélangé | Revue | `.github/workflows/deploy-vercel.yml` |

## Catalogues (Plugins, MCP, Skills) et accueil unifié

| # | Interaction critique | Vérification | Où |
|---|----------------------|--------------|----|
| 34 | Trois plugins réels ajoutés (qualité de l'air, boîte à outils JSON/YAML, jours fériés FR) avec outil typé, schéma Zod et permissions explicites | Unitaire | `tests/unit/plugins-catalog.test.ts` |
| 35 | `minTier` d'un plugin réellement appliqué côté serveur (install et activation), pas seulement affiché | Unitaire | `tests/unit/plugins-catalog.test.ts`, `lib/plugins/tier-lock.ts` |
| 36 | Aucun outil de plugin ne masque un outil natif (`PLUGIN_PROVIDED_TOOL_IDS` vs `NATIVE_TOOL_IDS`) | Unitaire + `plugins:check` | `tests/unit/plugins-catalog.test.ts`, `scripts/validate-plugins.ts` |
| 37 | Météo et Quizzly restent disponibles pour un compte Free ou en mode Fantôme (plus de désactivation silencieuse) | Unitaire | `tests/unit/plugins-catalog.test.ts` |
| 38 | Icône de plugin hors liste blanche → échec, jamais de repli silencieux | Unitaire + `plugins:check` | `tests/unit/plugins-catalog.test.ts`, `lib/plugins/icon-allowlist.ts` |
| 39 | Catalogue MCP unique et statique : plus de lecture des tables/fichiers de seed supprimés | Unitaire | `tests/unit/mcp-templates.test.ts` |
| 40 | Chaque modèle MCP est réellement documenté (URL éditeur, date de vérification, aucun hôte d'exemple) | Unitaire | `tests/unit/mcp-templates.test.ts` |
| 41 | Aucun secret en clair dans `args`/`env` ; chaque credential déclare sa destination (`kind`) et sa documentation | Unitaire | `tests/unit/mcp-templates.test.ts` |
| 42 | Modèle exigeant un OAuth interactif non pris en charge → installable refusée (pas de bouton inerte) | Unitaire + Revue | `tests/unit/mcp-templates.test.ts`, `lib/mcp-templates/install.ts` |
| 43 | Secrets MCP chiffrés injectés à l'appel dans le bon emplacement (env/auth/en-tête), jamais de placeholder | Unitaire | `tests/unit/mcp-templates.test.ts` |
| 44 | Installation MCP idempotente et appariement par `templateId` (repli par nom pour l'existant) | Unitaire | `tests/unit/mcp-templates.test.ts`, migration `0019_template_links.sql` |
| 45 | Écritures externes soumises à approbation (`write_only`/`ask_permission`), lectures seules automatiques | Unitaire | `tests/unit/mcp-templates.test.ts` |
| 46 | Catalogue de Skills unique (statique), identifiants et noms uniques, catégories connues | Unitaire | `tests/unit/skill-templates.test.ts` |
| 47 | Outils déclarés par un Skill connus des registres Chat et Agent, aucun identifiant inventé | Unitaire | `tests/unit/skill-templates.test.ts`, `lib/ai/tools/ids.ts` |
| 48 | `mcpServerNames` résolus contre les serveurs réellement installés ; serveurs manquants signalés | Unitaire | `tests/unit/skill-templates.test.ts`, `lib/skill-templates/install.ts` |
| 49 | Skill exploitant MCP jamais offert au forfait gratuit (`minTier` réellement appliqué) | Unitaire | `tests/unit/skill-templates.test.ts` |
| 50 | Installation d'un Skill idempotente, persistée (`templateId`) et vérifiée en base ; désinstallation réversible | Unitaire + Revue | `lib/skill-templates/install.ts`, `app/(chat)/api/skills/templates/route.ts` |
| 51 | Un seul sélecteur Chat | Agent à l'écran, construit par un composant partagé unique | Unitaire + e2e | `tests/unit/home-mode-switcher.test.ts`, `tests/e2e/agent.test.ts` |
| 52 | Sélecteur retiré de l'en-tête Agent et placé au même endroit sur les deux accueils | Unitaire + e2e | `tests/unit/home-mode-switcher.test.ts`, `tests/e2e/agent.test.ts` |
| 53 | Écart sélecteur → titre identique (32 px) et même largeur de pile d'accueil | Unitaire + e2e | `tests/unit/home-mode-switcher.test.ts`, `tests/e2e/agent.test.ts` |
| 54 | Rôles ARIA (tablist/tab), navigation clavier (flèches, Origine/Fin) et responsive mobile conservés | e2e + Revue | `tests/e2e/agent.test.ts`, `components/ui/pill-switcher.tsx` |
| 55 | Fonctions propres à chaque mode conservées (timeline, plan, autonomie côté Agent ; mentions, pièces jointes, dictée, plugins, MCP, Skills côté Chat) | Revue | `components/agent/agent-shell.tsx`, `components/chat/shell.tsx` |
| 56 | Migrations `0019` idempotentes (colonnes `templateId` texte + index uniques partiels) | Revue | `lib/db/migrations/0019_template_links.sql`, `lib/db/migrate.ts` |

## Commandes de validation réelles

```bash
pnpm check          # Ultracite/Biome : lint + format de tout le dépôt
pnpm typecheck      # tsc --noEmit — Ne voit PAS les modules backend (hors tsconfig)
pnpm test:unit      # Vitest : logique pure et garde-fous, sans réseau ni base
pnpm plugins:gen    # régénération des catalogues de plugins dérivés
pnpm plugins:check  # validation des catalogues de plugins générés
pnpm build          # Next build (équivalent reproductible du build Vercel)
```

**Cette section ne consigne plus de résultat daté ni de nombre de fichiers.** Un
compte rendu du type « 24 fichiers, 204 tests » était faux quelques jours plus
tard, et une photographie de l'état vert/rouge n'est vérifiable que le temps d'un
commit. Ce qu'il faut retenir à la place :

- `pnpm test:unit` est la référence ; le nombre de suites évolue à chaque lot, il
  ne se documente pas.
- `deno check <module>.ts` est le seul typecheck du backend Val Town : un
  `pnpm typecheck` ou `pnpm build` réussi ne dit **rien** de `main.ts`,
  `config.ts`, `vibe-*.ts`… (ils sont hors `tsconfig.json`).
- `pnpm check` ne doit **jamais** être remplacé par `pnpm fix` pendant un lot en
  cours : `fix` réécrit tout le dépôt, `*.sql` et `*.md` compris.

## Diagnostics préexistants

`biome.jsonc` désactive un sous-ensemble de règles (`noExplicitAny`, `useTemplate`,
`noStaticOnlyClass`, `useConsistentMemberAccessibility`, `noUnusedImports`…). La
liste des règles éteintes est dans le fichier de configuration, pas ici : une liste
recopiée dans ce document a déja renvoyé vers des règles qui ne s'appellent plus
comme ça. Les zones concernées (`lib/db/queries.ts`, le backend à la racine, les
portages Vibe et Wakies) portent de la dette de typage `as any` **sans que ce soit
une erreur de lint** : cela ne doit pas être présenté comme un voyant rouge.