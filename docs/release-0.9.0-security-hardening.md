# 0.9.0 — Durcissement sécurité, corrections Agent et fiabilité des migrations

> Ce document sert de **description de pull request** et de **notes de version**.
> Il accompagne la branche `canary` (commit examiné : `31bdd6402d32ea7ba5dcb8fe447cf318bde8f9fa`).

## Pourquoi

L'audit de la version 0.9.0 a montré qu'une exécution de code arbitraire, une
évasion de sandbox, des secrets chiffrables par un tiers, des sorties réseau non
contrôlées et des migrations destructrices étaient atteignables depuis les
fonctionnalités nouvelles. Ce lot corrige ces points, les bugs du mode Agent
confirmés dans le code, et outille la validation.

**Aucune fusion ni déploiement n'est effectué par ce lot.** Les commits restent
locaux jusqu'à autorisation explicite.

## 1. Sécurité — corrections apportées

| Domaine | Fichiers | Ce qui a changé |
|---|---|---|
| Sandbox HTML | `components/chat/sandbox-preview.tsx`, `lib/security/sandbox.ts` (nouveau), `artifacts/html/client.tsx` | `allow-same-origin` retiré (origine opaque), CSP restrictive injectée en tête de `<head>`, messages inter-fenêtres validés par `event.source`, téléchargement au lieu de `window.open` sur un blob d'HTML non fiable |
| Secrets MCP | `lib/mcp/encryption.ts`, `lib/mcp/dto.ts` (nouveau), `lib/mcp/secrets-write.ts` (nouveau), routes `/api/mcp*`, `scripts/reencrypt-mcp-secrets.ts` | Clé dédiée **obligatoire** (plus de dérivation depuis `DATABASE_URL`, plus de clé de dev codée en dur), format versionné `mai1.<keyId>.…`, rotation par trousseau, écriture exclusivement chiffrée, DTO redactés, URL/arguments nettoyés, export filtré |
| Réseau sortant | `lib/web/ssrf.ts`, `lib/web/safe-fetch.ts` (nouveau), `lib/web/zip-guard.ts` (nouveau), `read-url`, `extract`, `document-parser`, `web-capture`, `read-file` | Classification IP complète (encodages IPv4, IPv6 mappées/NAT64), **résolution DNS vérifiée puis épinglée**, redirections suivies manuellement et revalidées, plafond d'octets pendant la lecture, `Accept-Encoding: identity`, `Authorization` limité à une liste blanche d'origines par saut, tores tiers nettoyés, garde anti-bombe ZIP |
| Identité | `lib/agent/channel.ts`, `lib/auth/session.ts` | Propriété des conversations par identifiant canonique uniquement, cache de sessions borné (LRU 500 + purge), `exp` exigé, `iss`/`aud` vérifiés s'ils sont configurés |

## 2. Mode Agent — bugs corrigés

- **Modèle résolu** : `checkAgentModelAccess` juge désormais les capacités du modèle effectivement résolu (`resolvedEntry`), plus celles du modèle demandé.
- **Forfait** : `GET /api/agent/settings` lit `users.tier` persisté (`getPersistedTier`), plus le tier de session/cache.
- **Réorientation** : les consignes sont injectées dans `prepareStep` (donc avant l'appel suivant) et non plus lues seulement en fin d'étape.
- **Arrêt** : `stopRequested` déclenche un `AbortController` interne chaîné au signal HTTP — l'arrêt interrompt réellement la génération.
- **Budgets cumulés** : compteurs persistés atomiquement, `startToolCallCount` transmis à chaque reprise, télémétrie du nombre réel d'outils, `stopWhen` cumulé sur les étapes.
- **Planification** : champ `runAt` (date locale + fuseau IANA, refus des dates passées/inexistantes) ; la conversation d'une tâche planifiée est dérivée du schedule (`scheduleChatId`) au lieu du `projectId`, avec vérification du propriétaire.

## 3. Base de données

- **Plus de DDL au runtime** : `ensureTableTypes`/`ensureColumnDefaults` sont hors du chemin de requête, derrière `DB_RUNTIME_DDL_REPAIR=true` (dépannage ponctuel uniquement).
- **`weekly_usage`** : la réparation ne supprime plus jamais une ligne sans **sauvegarde vérifiée** (`CREATE TABLE … AS SELECT` était un no-op quand la sauvegarde existait déjà, le `DELETE` s'exécutait quand même). Corrigé dans `lib/db/queries.ts` et `scripts/repair-db-drift.mjs`.
- **Migrations visibles** : `lib/db/migrate.ts` ne masque plus les échecs (`noteIgnoredStep` classe par SQLSTATE ; un échec inattendu fait échouer la migration, sauf `MIGRATIONS_STRICT=false` explicite).

### Migrations concernées

`0015_plugins`, `0016_agent`, `0017_agent_foundation`, `0018_agent_user_input`, `0019_template_links`, `0020_project_collaboration`, `0021_document_proposals` — plus les réparations de schéma de `migrate.ts`.
**Validité vérifiée en CI sur base éphémère (deux passages = idempotence). Reste à valider sur une copie représentative de la production** (voir « Risques résiduels »).

## 4. Dépendances

| Paquet | Avant | Après | Effet |
|---|---|---|---|
| `next` | 16.2.10 | **16.3.3** | 2 critiques (RCE Windows, AVIF) + 4 élevées (middleware, DoS, SSRF, rewrites) ; corrige aussi `sharp`/`postcss` embarqués |
| `next-auth` | 5.0.0-beta.25 | **5.0.0-beta.32** | 2 critiques (fail-open, homoglyphes) + 1 élevée |
| `nodemailer` | 7.0.13 | **9.1.1** | lecture de fichiers/SSRF, DoS quadratique |
| `@vercel/blob` | 0.24.1 | **2.8.0** | retire `undici@5.28.5` vulnérable |
| overrides `pnpm` | — | `@auth/core ≥0.41.3`, `kysely ≥0.28.17`, `linkify-it ≥5.0.2`, `lodash-es ≥4.18.0`, `ws ≥8.21.0` | alertes transitives |

**Résultat mesuré : `pnpm audit --prod` = 0 critique, 0 élevée** (contre 5 / 22 avant). 6 alertes modérées subsistent, sans correctif publié.

## 5. CI/CD

- `.github/workflows/ci.yml` (nouveau) : installation gelée, format, lint, typecheck, tests unitaires, contrôle des plugins, build, migrations sur Postgres éphémère (2 passages), `pnpm audit --audit-level high`, gitleaks (arbre + historique), CodeQL, SBOM, E2E authentifiés.
- `.github/workflows/deploy-vercel.yml` : `preview` **sans aucun accès base**, `production` réservé à `main`, rattaché à l'environnement GitHub `production` (approbation), CLI Vercel épinglée (`59.23.2`).

## 6. Nettoyage du dépôt

Retirés de l'index (copies locales conservées) : `.freebuff/project-id`, `dev-server.log`, `playwright-report/index.html`, `test-results/.last-run.json`, `tsconfig.tsbuildinfo`, `build.log` — plus les règles `.gitignore` correspondantes. Espaces en fin de ligne supprimés dans `auth.ts` (17 lignes) et `vibe-mai-fleet.ts` (1 ligne). **Analyse de secrets : aucune correspondance** dans ces fichiers.

## 7. Nouvelles variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `MCP_ENCRYPTION_KEY` | **obligatoire** | Clé dédiée de chiffrement des secrets MCP. Sans elle, l'enregistrement de secrets est refusé (503) — jamais de repli en clair. |
| `MCP_ENCRYPTION_KEY_ID` | `v1` | Identifiant de la clé courante (rotation). |
| `MCP_ENCRYPTION_PREVIOUS_KEYS` | — | JSON `{"<keyId>":"<clé>"}` pour déchiffrer après rotation. |
| `MCP_ENCRYPTION_ALLOW_LEGACY_DERIVED_KEY` | `false` | Autorise la lecture des valeurs héritées le temps du ré-encodage. **À retirer ensuite.** |
| `CHAT_OWNER_LEGACY_MATCH` | `false` | Rétablit temporairement l'ancienne tolérance email/pseudo. **À retirer après migration.** |
| `DB_RUNTIME_DDL_REPAIR` | `false` | Réparations de schéma au runtime (dépannage uniquement). |
| `MIGRATIONS_STRICT` | `true` | Un échec de réparation inattendu fait échouer la migration. |
| `MAI_API_URL` / `MAI_API_ORIGIN` | — | Origines autorisées à recevoir le jeton de session. **À définir en production**, sinon aucun jeton n'est envoyé. |
| `MAI_JWT_ISSUER` / `MAI_JWT_AUDIENCE` | — | Contrôles de claims renforcés. |

## 8. Plan de déploiement

1. Définir `MCP_ENCRYPTION_KEY` (+ `MAI_API_URL`) dans l'environnement `production` **avant** le déploiement.
2. Sauvegarde complète de la base ; vérifier la restauration sur une copie.
3. `pnpm exec tsx scripts/reencrypt-mcp-secrets.ts` (simulation), puis `--apply`.
4. `pnpm exec tsx scripts/migrate-chat-owner-canonical.ts` (simulation), puis `--apply` — **prérequis** au durcissement de `chatOwnerMatches`.
5. Mettre `CHAT_OWNER_LEGACY_MATCH=true` si des lignes restent non résolues, puis le retirer.
6. Déployer (job `production`, approbation requise).
7. Vérifier : envoi d'email OTP, connexion, un run Agent complet, une lecture de document, un serveur MCP existant.

## 9. Sauvegarde et rollback

- **Sauvegarde** : snapshot avant migration ; vérifier `weekly_usage_drift_backup` après le passage.
- **Rollback applicatif** : redéployer l'artefact précédent (Vercel) — les migrations ajoutées sont additives.
- **Rollback de données** : les suppressions de `weekly_usage` sont désormais bloquées sans sauvegarde vérifiée ; restaurer depuis le snapshot en cas de doute.
- **Clé de chiffrement** : ne jamais supprimer une clé avant que `MCP_ENCRYPTION_PREVIOUS_KEYS` ne soit vidé *après* ré-encodage complet.

## 10. Risques résiduels (connus, à traiter)

1. **MCP stdio — bloquant, hors périmètre de ce lot** (à la demande explicite de ne pas y toucher) : `/api/mcp/test` accepte `transport: "stdio"` avec une commande et des arguments fournis par l'utilisateur, transmet tout `process.env` au processus enfant et n'applique **aucun** contrôle `allowStdio` (contrairement à `/api/mcp` et `/api/mcp/[id]`). **PR dédiée requise avant toute fusion.**
2. `nodemailer@9` est en conflit de peer avec `@auth/core` (attendu `^7 || ^8`) : valider l'envoi de l'email OTP en préproduction.
3. 6 alertes modérées sans correctif publié.
4. `package.json` non couvert (`scripts/e2e-repro.mjs` non suivi) : hors périmètre.
5. Validation des migrations sur copie de production : dépend d'un environnement fourni par l'exploitant.
6. `pnpm check` (ultracite) reste rouge sur le dépôt préexistant (~6 940 diagnostics) : traité fichier par fichier, pas par reformatage global.

## 11. Découpage recommandé de la PR

| PR | Contenu | Mergeable seul |
|---|---|---|
| A | MCP stdio (bloqueur) + secrets + sandbox + réseau | Non — dépend du lot sécurité |
| B | Agent (modèle résolu, arrêt/réorientation, budgets, planification, identité) | Oui |
| C | Base de données / migrations | Oui |
| D | Dépendances + CI/CD | Oui |
| E | Nettoyage du dépôt + documentation | Oui |

## 12. Protections à activer sur `main`

Branche protégée, PR obligatoire, validations CI requises, revue par CODEOWNERS pour la sécurité, l'authentification, la base de données, l'infrastructure et le moteur Agent, environnements `production` protégés par approbation.
