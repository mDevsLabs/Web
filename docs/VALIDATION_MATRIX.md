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

## Commandes de validation réelles

```bash
pnpm check          # Ultracite/Biome : lint + format (diagnostics préexistants exclus)
pnpm typecheck      # tsc --noEmit
pnpm test:unit      # Vitest : 18 fichiers, 141 tests
pnpm plugins:check  # validation des catalogues de plugins générés
pnpm build          # Next build (équivalent reproductible du build Vercel)
```

Résultat au 2026-09-14 : typecheck ✅ · tests unitaires ✅ (141 passés, 2
skippés préexistants) · plugins:check ✅ · build ✅ · lint des fichiers modifiés
✅ (3 diagnostics préexistants non liés aux lots, listés ci-dessous).

## Diagnostics préexistants (non introduits par ces lots)

- `lib/db/queries.ts:3874` — `noControlCharactersInRegex`
- `lib/db/queries.ts:3976` — `useTemplate`
- `components/planning/schedule-dialog.tsx:76` — `useExhaustiveDependencies` (hook `isOpen`)

Ces zones n'ont pas été modifiées (règle : ne pas corriger des zones sans
rapport pour obtenir un voyant vert). Le reste du dépôt (`web.ts`, backend mAI
à la racine) porte des diagnostics préexistants hors périmètre de ces lots.