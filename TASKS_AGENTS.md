# Liste des tâches — Agents IA, icônes, couleurs, planification

> Fichier de travail **jetable** — à supprimer une fois le chantier terminé.
> `TASKS.md` (racine) couvre un chantier parallèle (socle design) : ne pas
> confondre les deux listes.

## Résumé

| # | Étape | Statut |
|---|---|---|
| 1 | Migration `0029` + journal + `schema.ts` + DDL miroir | ☑ |
| 2 | Limites d'agents par forfait (15/25/∞) | ☑ |
| 3 | Modèle par défaut unique `gemini/gemini-3.8-flash` | ☑ (⚠ prérequis bloquant) |
| 4 | Dédoublonnage en lecture + test de non-régression | ☑ |
| 5 | Suppression du système emoji | ☑ |
| 6 | Designer : retrait du playground + repositionnement de la croix | ☑ |
| 7 | Palette 10 couleurs + couleur libre (composant partagé) | ☑ |
| 8 | Onglet « Modèles » avec recherche + filtres | ☑ |
| 9 | Icônes uniques — 16 plugins | ☑ |
| 10 | Icônes uniques — modèles de skills | ☑ |
| 11 | Planification : 3 modes d'outils | ☑ |
| 12 | Validation | ☑ typecheck / tests / lint · ☐ build · ☐ `db:migrate` |

> **Note numérotation** : `0029` est réservé par ce chantier
> (`0029_agent_templates_icons_and_tool_modes.sql`, `_journal.json` idx 28 /
> when 1787552720000). Le chantier parallèle démarre à `0030`.

> **⚠ Prérequis bloquant (étape 3)** : `gemini/gemini-3.8-flash` doit exister dans
> le registre des modèles servi par `GET /api/models`. Au 26/09/2026 il est
> absent de `models.ts` (backend Val Town, 5 entrées) comme de
> `FALLBACK_MODELS`. **La constante est posée, le modèle n'existe pas encore** :
> sans lui, le chat retombe sur le fallback de `pickDefaultAgentModel`.
> Voir « Reste à faire ».

> **Chantier parallèle dans le même arbre de travail** : une autre session
> édite `lib/db/schema.ts`, `lib/agent/*`, `app/(chat)/api/chat/schema.ts`,
> `tests/unit/chat-schema-tolerance.test.ts`, `components/settings/memory-card.tsx`.
> Ne pas « corriger » les erreurs qui en viennent.

---

## 1. Migration `0029` ☑

- [x] 1.1 `lib/db/migrations/0029_agent_templates_icons_and_tool_modes.sql`
      — dédoublonnage `AgentTemplate` (garde le plus ancien par nom)
- [x] 1.2 … — `CREATE UNIQUE INDEX "AgentTemplate_name_key"` (rend le seed de
      `0007_agents.sql` idempotent : `ON CONFLICT DO NOTHING` sans cible
      couvre désormais l'index. **Ne pas éditer `0007`**, sinon Drizzle rejoue
      le fichier sur son nouveau hash)
- [x] 1.3 … — `DROP COLUMN IF EXISTS "emoji"` sur `Agent` et `AgentTemplate`
- [x] 1.4 … — `UPDATE` + `ALTER COLUMN SET DEFAULT` du modèle par défaut sur
      `AgentTemplate`, `Agent`, `ScheduledMessage`
- [x] 1.5 … — `ADD COLUMN IF NOT EXISTS "toolMode"` + `CHECK` + backfill
- [x] 1.6 `lib/db/migrations/meta/_journal.json` — entrée idx 28
- [x] 1.7 `lib/db/schema.ts` — `emoji` retiré, `DEFAULT_CHAT_MODEL` importé,
      `uniqueIndex("AgentTemplate_name_key")`, `toolMode` sur `ScheduledMessage`
- [x] 1.8 `lib/db/queries.ts` — DDL miroir (`Agent` L939, `AgentTemplate`
      L986, `ScheduledMessage` L1060) + bloc `toolMode` dans le `DO` de réparation

## 2. Limites d'agents par forfait ☑

- [x] 2.1 `lib/plans/tier-limits.ts` — `TierLimits.agents` (`free: 0`,
      `plus: 15`, `pro: 25`, `max: null`) + `getTierAgentLimit`,
      `isAgentLimitUnlimited`, `isAgentQuotaExceeded`, `agentQuotaMessage`
- [x] 2.2 `config.ts` — `TIER_AGENT_LIMITS` + `getTierAgentLimit` (miroir
      backend)
- [x] 2.3 `app/(chat)/api/agents/route.ts` — `GET` renvoie `{ agents, limit }`,
      `POST` applique le quota du forfait (ligne ~53)
- [x] 2.4 `app/(chat)/api/agents/[id]/duplicate/route.ts` — quota du forfait
- [ ] 2.5 `app/(chat)/agents/agents-client.tsx` — consommer `{ agents, limit }`,
      affichage `n/15` ou `n/∞`, bouton désactivé au plafond
- [ ] 2.6 `components/agents/agent-selector.tsx:93` — idem
- [ ] 2.7 `components/agents/agents-stats.tsx:196` — idem
- [ ] 2.8 `hooks/use-active-chat.tsx` — adapter `mutate` au nouveau payload
- [ ] 2.9 `app/(chat)/agents/page.tsx:42` + `app/(chat)/settings/page.tsx:1462`
      — copies « jusqu'à N agents »

## 3. Modèle par défaut unique ☑

- [x] 3.1 `lib/ai/models.ts` — `DEFAULT_CHAT_MODEL = "gemini/gemini-3.8-flash"`,
      `titleModel` aligné
- [x] 3.2 Littéraux remplacés par l'import de la constante :
      `lib/db/queries.ts`, `lib/db/schema.ts`,
      `app/(chat)/api/planning/route.ts`, `lib/planning/executor.ts`
- [ ] 3.3 Vérifier que l'id est servi par `GET /api/models` (prérequis bloquant)

## 4. Dédoublonnage en lecture ☑

- [x] 4.1 `lib/agent-templates/dedupe.ts` (nouveau) —
      `dedupeAgentTemplatesByName()` : helper pur, testable sans base
- [x] 4.2 `lib/db/queries.ts:getAgentTemplates()` — appelle le helper
- [x] 4.3 `tests/unit/agents-quota-models.test.ts` — table sale rejouée, une
      seule ligne par nom, la plus ancienne conservée

## 5. Suppression du système emoji ☑

- [x] 5.1 `components/agents/agent-icon.tsx` — prop `emoji`, `EMOJI_PRESETS`,
      `isEmoji` retirés ; `variant="default"` re-style en badge coloré
- [x] 5.2 `lib/db/queries.ts` — `AgentInput.emoji`, insert, `duplicateAgent`,
      `agentsWithStats`, `agentEmoji` dans les 2 SELECT JOIN
- [x] 5.3 `app/(chat)/agents/agents-client.tsx` — `formEmoji`, `formIconType`,
      sélecteur emoji, payload, cartes, aperçus
- [x] 5.4 `components/agents/agent-selector.tsx`, `components/agents/agents-stats.tsx`
- [x] 5.5 `components/chat/chat-agent-icon.tsx` (prop `agentEmoji`),
      `sidebar-history-item.tsx`, `multimodal-input.tsx`, `mention-menu.tsx`,
      `input/context-chips.tsx`, `greeting.tsx`
- [x] 5.6 `app/(chat)/settings/page.tsx` (`prefAgents`), `schedule-dialog.tsx`,
      `planning-client.tsx`
- [x] 5.7 Copies « icône/emoji » → « icône » : `app/(chat)/agents/page.tsx`,
      `agents-client.tsx` (description du dialogue), `settings/page.tsx`
- [x] 5.8 Zod `emoji` retiré de `api/agents/route.ts` + `[id]/route.ts` ;
      garde graphème supprimée

## 6. Designer : playground + croix ☑

- [x] 6.1 `agents-client.tsx` — `editorTab`, `handleSendPlaygroundMessage`,
      switcher d'onglets et bloc playground supprimés (~150 lignes)
- [x] 6.2 … — imports morts (`PlayIcon`, `SendIcon`) retirés ;
      `SlidersHorizontalIcon` / `MessageSquareTextIcon` conservés (encore
      utilisés ailleurs dans le fichier)
- [x] 6.3 … — `DialogHeader className="pr-12"` : la croix
      (`absolute top-4 right-4`) ne chevauche plus le contenu
- [x] 6.4 `app/(chat)/agents/page.tsx` — 🤖 de la page paywall remplacé par
      `BotIcon`

## 7. Palette 10 couleurs + couleur libre ☑

- [x] 7.1 `components/agents/agent-presets.ts` — `AGENT_COLORS` 16 → 10
      (hex déjà présents, donc aucun agent ne perd sa couleur), 2 lignes de 5
- [x] 7.2 Nouveau `components/common/color-picker.tsx` — `grid-cols-5`,
      `<input type="color">` + champ hex validé (`/^#[0-9a-fA-F]{6}$/`)
- [x] 7.3 `agents-client.tsx` — `ColorPicker`
- [x] 7.4 `app/(chat)/skills/skills-client.tsx` — `ColorPicker`
- [x] 7.5 `components/settings/configuration-client.tsx` — `ColorPicker`

## 8. Onglet « Modèles » ☑

- [x] 8.1 `agents-client.tsx` — `activeTab: "agents" | "templates" | "stats"`,
      bouton `Modèles ({templates.length})`
- [x] 8.2 … — grille de modèles sortie de l'onglet « Mes agents »
- [x] 8.3 … — barre de recherche dédiée + `<select>` modèle + chips de tags +
      bouton « Réinitialiser » + compteur `n sur 12`
- [x] 8.4 … — état vide « Mes agents » avec 2 CTA (Parcourir les modèles /
      Créer mon premier agent, désactivé au quota) ; état vide « Modèles »

## 9. Icônes uniques — plugins ☑

Résultat : **16 icônes distinctes** (doublons corrigés : `Code`×2 → `Github` /
`Gitlab`, `Atom`×2 → `Atom` / `Library`, `BarChart3`×2 → `Landmark` /
`Banknote`, `Leaf`×2 → `Wind` / `Salad`).

- [x] 9.1 `lib/plugins/icon-allowlist.ts` — ajout de `Banknote`, `GitBranch`,
      `Github`, `Gitlab`, `Landmark`, `Library`, `Mail`, `NotebookPen`,
      `Salad`, `Wind` (48 → 58 noms)
- [x] 9.2 `lib/plugins/icon.tsx` — import + entrée `LUCIDE_ICONS` pour les 10
      (le `Record<LucideIconName, …>` rend cette étape obligatoire)
- [x] 9.3 `lib/plugins/github-public/index.json` → `Github`
- [x] 9.4 `lib/plugins/gitlab-public/index.json` → `Gitlab`
- [x] 9.5 `lib/plugins/openalex/index.json` → `Library`
- [x] 9.6 `lib/plugins/eurostat/index.json` → `Landmark`
- [x] 9.7 `lib/plugins/world-bank/index.json` → `Banknote`
- [x] 9.8 `lib/plugins/air-quality/index.json` → `Wind`
- [x] 9.9 `lib/plugins/open-food-facts/index.json` → `Salad`
- [x] 9.10 `pnpm plugins:gen` (`catalog.generated.ts` + `server.generated.ts`
      régénérés) puis `pnpm plugins:check` → ✓ 16 plugins valides

## 10. Icônes uniques — skills ☑

- [x] 10.1 `app/(chat)/tools/skills-panel.tsx:44-53` — **le vrai bug** :
      `SkillGlyph` ignorait `template.icon` et forçait `SparklesIcon`, donc
      tous les modèles se ressemblaient. Elle rend maintenant le manifeste
      teinté par `color` (3 appelants : 213, 278, 334)
- [x] 10.2 `lib/plugins/icon-allowlist.ts` + `icon.tsx` — `GitBranch`, `Mail`,
      `NotebookPen` (`Rss` était déjà dans l'allowlist)
- [x] 10.3 `lib/skill-templates/index.ts` — `notion-organizer` → `NotebookPen`,
      `email-drafter` → `Mail`, `github-maintainer` → `GitBranch`,
      `brave-tech-watch` → `Rss` (au lieu de `Map`, une carte pour une veille)
- [x] 10.4 Vérifié par test : plus aucun doublon d'icône sur les 20 modèles

## 11. Planification : 3 modes d'outils ☑

- [x] 11.1 `lib/planning/tool-mode.ts` (nouveau) — `SCHEDULE_TOOL_MODES`,
      `SCHEDULE_TOOL_MODE_META`, `normalizeScheduleToolMode`,
      `deriveScheduleToolMode` (backfill des tâches antérieures à `0029`)
- [x] 11.2 `lib/planning/executor.ts` — `auto` = natifs + plugins + MCP + skills,
      `plugins` = plugins + MCP + skills, `none` = aucun outil
- [x] 11.3 `app/(chat)/api/planning/route.ts` + `[id]/route.ts` — zod `toolMode`,
      `enabledTools` déprécié (plus lu par l'exécuteur)
- [x] 11.4 `lib/db/queries.ts` — `toolMode` en create/update
- [x] 11.5 `components/planning/schedule-dialog.tsx` — 3 cartes radio avec
      icône + description, suppression des 22 chips, du SWR `/api/plugins` et de
      `toggleTool`
- [x] 11.6 `app/(chat)/planning/planning-client.tsx` — badge mode au lieu des
      ids d'outils bruts (`webSearch` etc. affichés tels quels)
- [x] 11.7 `app/(chat)/api/agents/stats/route.ts` — `agentLimit` ajouté au
      payload des statistiques

## 12. Validation

- [x] 12.1 `tsc --noEmit` — **0 erreur** sur l'ensemble du dépôt à la fin du
      lot (le chantier parallèle a stabilisé ses fichiers entre-temps).
- [x] 12.2 `vitest run` — **592 pass / 1 fail / 4 skip**. Le seul échec est
      `tests/unit/tier-limits.test.ts` (« préserve optional met nullable »),
      test que le chantier parallèle vient d'ajouter et qui n'est pas encore au
      vert de son côté. Nouveau fichier
      `tests/unit/agents-quota-models.test.ts` : **42/42 pass**.
- [x] 12.3 `validate-plugins.ts` → ✓ 16 plugins valides
- [x] 12.4 `biome check` sur les 24 fichiers du chantier → clean
- [ ] 12.5 `pnpm build` — non lancé (le chantier parallèle avait des erreurs TS
      en cours pendant ce lot ; à relancer une fois les deux lots mergés)
- [ ] 12.6 `pnpm db:migrate` sur une base de staging (aucun job Postgres en CI)
- [ ] 12.7 Smoke test : Plus → 15 agents puis 403 ; Max → sans limite ;
      12 modèles affichés une seule fois ; onglet Modèles filtrable ;
      tâche planifiée en `none` sans outil

---

## Reste à faire (hors de ce lot)

- [ ] **Modèle `gemini/gemini-3.8-flash`** — l'id doit être publié par le
      registre du backend (`models.ts`, aujourd'hui 5 entrées) **avant** de
      merger, sinon le chat retombe sur `pickDefaultAgentModel`.
- [ ] **`db:migrate` sur staging** pour purge les 12 doublons et poser
      `toolMode` / `AgentTemplate_name_key`.
- [ ] `pnpm build` une fois le chantier parallèle stabilisé.
