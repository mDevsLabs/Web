# Liste des tâches — Refonte mAI Web (socle design)

> Fichier de travail **jetable** — à supprimer une fois le chantier terminé.
> `TASKS_AGENTS.md` couvre un chantier parallèle (templates d'agents, icônes,
> mode de raisonnement) : ne pas confondre les deux listes.

## Résumé

| # | Phase | Statut |
|---|---|---|
| 1 | Socle design : tokens & primitives | ☑ |
| 2 | Largeur page Messages archivés | ☑ |
| 3 | Suppression des catégories de mémoire | ☑ |
| 4 | Garde de permission notifications | ☑ |
| 5 | Limites d'instructions par forfait | ☑ |
| 6 | Migrations 0031 / 0032 | ☑ |
| 7 | Documentation (AGENTS.md + BACKEND_API.md) | ☑ |
| 8 | Validation | ☑ typecheck · ☑ tests · ☑ lint · ☐ build |

> **Note numérotation** : `0029` et `0030` sont occupés par le chantier
> parallèle. Ce chantier utilise donc **0031** (`_journal.json` idx 30 /
> when 1787552830000) et **0032** (idx 31 / when 1787552840000).

> **Résultat validation** : `tsc --noEmit` → 0 erreur · `vitest run` → 594
> tests, 62 fichiers, 0 échec · Biome → 1 avertissement `noNoninteractiveTabindex`
> sur `role="tabpanel"` + `tabIndex={0}` (faux positif : c'est le motif ARIA
> correct ; le correctif « unsafe » de Biome le supprimerait et casserait la
> navigation clavier — **ne pas l'appliquer**).

---

## Phase 1 — Socle design : tokens & primitives minimalistes

- [x] 1.1 `app/globals.css` — `@utility` `surface-card`, `surface-muted`, `chip` (+ `data-active`), `field-input`
- [x] 1.2 `app/globals.css` — `--radius` `0.625rem` → `0.5rem` ; tokens `--success` / `--warning` / `--info` (clair **et** sombre) mappés dans `@theme inline`
- [x] 1.3 `app/(chat)/settings/page.tsx` — 13× motif de carte → `surface-card` ; 37 classes de couleur codées en dur → tokens
- [x] 1.4 `components/settings/memory-card.tsx` — 20× amber, 18× sky, 6× emerald, dégradés de jauges → tokens (cumulé avec la phase 3)
- [x] 1.5 `app/(chat)/settings/agent/page.tsx` — 4 amber / 4 emerald
- [x] 1.6 `app/(chat)/archived/page.tsx` — 3 amber

## Phase 2 — Largeur page Messages archivés

- [x] 2.1 `archived/page.tsx:118` — structure alignée sur `settings/agent/page.tsx:110-111` (`max-w-6xl`, padding sur le conteneur interne, `pb-16`)
- [x] 2.2 `archived/page.tsx:179` — grille `lg:grid-cols-2`

## Phase 3 — Suppression des catégories de mémoire

- [x] 3.1 `memory-card.tsx` — `MEMORY_CATEGORIES` + 6 icônes
- [x] 3.2 `memory-card.tsx` — états `categoryFilter` / `newCategory` / `editCategory`
- [x] 3.3 `memory-card.tsx` — filtrage réduit à portée + important + recherche (`importantOnly: boolean`)
- [x] 3.4 `memory-card.tsx` — barre de filtres unifiée (`chip`), 2 `<select>`, badges
- [x] 3.5 `memory-card.tsx` — `category` de l'export, de l'import, du type `MemoryEntry`
- [x] 3.6 `api/memory/route.ts`
- [x] 3.7 `api/memory/import/route.ts`
- [x] 3.8 `lib/db/queries.ts` (DDL runtime inclus)
- [x] 3.9 `lib/db/schema.ts` + `scripts/repair-db-drift.mjs`

## Phase 4 — Garde de permission notifications

- [x] 4.1 Nouveau `components/chat/notification-permission-gate.tsx`
- [x] 4.2 `app/(chat)/layout.tsx` — monté à côté de `<OnboardingTutorial />`
- [x] 4.3 Clé `mai_notif_prompt_dismissed` + attente de fin d'onboarding + délai 1,2 s
- [x] 4.4 « Activer » (permission + `POST /api/notifications/preferences`) / « Fermer — ne plus afficher »
- [x] 4.5 `lib/db/queries.ts` — `gate` complété des 6 types `agent_*` + `project_member_joined`
- [x] 4.6 `lib/notifications/types.ts` (nouveau, partagé client/serveur) + `hooks/use-notifications.ts`
- [x] 4.7 `notification-bell.tsx` — icônes des 11 types + `api/notifications/route.ts` allowlist + `preferences/route.ts` schéma
- [x] 4.8 Bouton « Revoir l'invite » dans Paramètres → Notifications

## Phase 5 — Instructions personnalisées : limites par forfait

- [x] 5.1 `lib/plans/tier-limits.ts` — `TIER_CUSTOM_INSTRUCTIONS` + `CUSTOM_INSTRUCTIONS_HARD_CAP = 100_000`
- [x] 5.2 `getTierCustomInstructionsMax()` / `getCustomInstructionsEffectiveMax()` / `exceedsCustomInstructionsProductLimit()`
- [x] 5.3 `lib/plans/custom-instructions.ts` — 2 fabriques de schéma + payload d'erreur à 2 causes + libellés
- [x] 5.4-5.10 les 7 schémas Zod (2 variantes : nullable pour PATCH, non-nullable pour POST)
- [x] 5.11 `settings/page.tsx` — `maxLength` dynamique, compteur, mention, avertissement + lien d'upgrade
- [x] 5.12 `settings/page.tsx` — `.slice(customInstructionsMax)` + toast de troncature

## Phase 6 — Migrations

- [x] 6.1 `0031_memory_schema_cleanup.sql` — `ADD COLUMN IF NOT EXISTS` ×3 puis `DROP COLUMN IF EXISTS "category"`
- [x] 6.2 `0032_custom_instructions_limits.sql` — troncature `CASE lower(tier)`, défaut 2000
- [x] 6.3 `meta/_journal.json` — idx 30 / 31
- [x] 6.4 `scripts/repair-db-drift.mjs`
- [x] 6.5 `lib/db/migrate.ts` — bloc `UserMemory` en `try/catch` + `noteIgnoredStep(error)`
- [x] 6.6 `scripts/check-db-schema.mjs` — `UserMemory` en table requise + 3 colonnes

## Phase 7 — Documentation

- [x] 7.1 `AGENTS.md` (racine) — bloc `nextjs-agent-rules` conservé, contenu en français
- [x] 7.2 `docs/BACKEND_API.md` — graphe d'imports transitif de `main.ts`

## Phase 8 — Validation

- [x] 8.1 `tsc --noEmit` → 0 erreur
- [x] 8.2 Biome `check --write` sur les 30 fichiers touchés
- [x] 8.3 `vitest run` → 594 tests
- [x] 8.4 Nouveau `tests/unit/tier-limits.test.ts` (16 tests)
- [x] 8.5 `chat-schema-tolerance.test.ts` adapté à la fabrique de schéma
- [ ] 8.6 `pnpm build` — non exécuté
