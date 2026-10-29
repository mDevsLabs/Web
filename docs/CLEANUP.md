# Nettoyage du dépôt

Le chantier retire 141 fichiers : 135 fichiers des services autonomes, tests, configurations et CI OpenMuse remplacés par l’hôte mAI, et six scripts temporaires d’inspection ou de réécriture. [CLEANUP_INVENTORY.json](CLEANUP_INVENTORY.json) conserve chaque chemin, son empreinte et la justification du retrait.

## Second chantier : applications de référence et dépendances

Un chantier complémentaire a retiré 43 fichiers supplémentaires — portant l’inventaire à 184 retraits — et 16 dépendances déclarées mais jamais importées. Le périmètre a été volontairement **prudent** : les arbres de référence `apps/site`, `apps/vibe` et `apps/wakies` sont conservés en entier, et seules les sources qui nourrissent le build de l’hôte ou ses lectures à l’exécution restent en place.

### Ce qui a été retiré

- **Vibe** : la feuille `src/App.css` (importée par rien), la déclaration de module `src/types/lucide-react.d.ts`, le module `lib/recommendation/` (sans importeur), l’identifiant d’outil `.freebuff/`, les sept plans de session `.zcode/plans/` et le doublon `scripts/newsletter_editor.html` de l’exemplaire racine.
- **Blackline** : le conditionnement natif Electron/Capacitor `apps/blackline/apps/` (17 fichiers suivis et 2 302 artefacts de build non suivis), le workflow `apps/blackline/.github/workflows/build.yml` — **imbriqué**, donc jamais exécuté par GitHub Actions —, les scripts de préparation native devenus orphelins, le script de traçage `scripts/trace-imports.mjs` et la copie parasite `src/main.ts.new`.
- **Coder** : le script de test orphelin `test-segments.mjs` et la migration ponctuelle déjà appliquée `scripts/tokenize-mac-codex.mjs`.
- **Site** : le chas d’export `email.ts`, la copie périmée `mai-identity.ts` — le module racine fait foi — et la configuration `tsconfig.valtown.json`, **cassée** : ses vingt entrées `include` visent des modules du backend Val Town déplacés à la racine.

Le chas `email.ts` n’était pas mort comme il y paraissait : l’application Site autonome importait `@/email` — donc ce chas — dans `app/actions/admin-users.ts` et `app/actions/support.ts`. Ces deux imports visent désormais `@/lib/email`, le module réel, que le chas ne faisait que réexporter. La règle « ne jamais importer `@/email` » (Règle n° 7 de `docs/5-site/AGENTS.md`) est ainsi respectée jusque dans l’application autonome.

### Tests déplacés plutôt que supprimés

Trois tests vivaient dans des emplacements où **aucun exécuteur ne les collectait**. Aucun n’a été perdu : chacun a été déplacé vers la suite unitaire de l’hôte, qui les exécute désormais.

| Ancien emplacement | Nouvel emplacement | Pourquoi |
| --- | --- | --- |
| `apps/desktop/src/session-token.test.ts` | `tests/unit/desktop-session-token.test.ts` | Le paquet `apps/desktop` n’a ni configuration Vitest ni script `test` ; la collecte racine n’atteint pas `apps/`. Converti de `node:test` à Vitest. |
| `apps/site/tests/mai-identity.test.ts` | `tests/unit/mai-identity.test.ts` | Il vérifiait la copie **périmée** d’identity du Site autonome, un sous-ensemble strict du module racine. Il vérifie désormais le module **vivant** (`@/mai-identity`), comme le fait déjà `tests/unit/mai2-model-traits.test.ts`. |

Un quatrième test, `apps/blackline/tests/native.test.mjs`, portait sur le conditionnement natif retiré : deux de ses trois vérifications ont disparu avec lui, la troisième — les services retirés répondent toujours **410** — est conservée dans `apps/blackline/tests/retired-services.test.mjs`.

### Ce qui a été conservé, et pourquoi

`apps/blackline/lib/game/**` et `apps/blackline/api/**`, `lib/db/**`, `lib/server/**` sont **vivants** : le premier est importé par 31 fichiers de `src/**`, les seconds sont les services retirés (réponse **410 Gone**) que la suite de tests du jeu vérifie encore. `docs/DEPLOYMENT.md` documente cette conservation. `apps/blackline/lib/game/**` avait été pressenti pour un retrait : l’audit des imports l’a intégré au jeu, et il est resté.

Les **miroirs** de `apps/vibe/src/**`, `apps/site/{app,components,lib}/**` et l’archive `apps/wakies/**` sont conservés : `AGENTS.md` les déclare comme sources de référence, et les générateurs CSS, les lectures à l’exécution et les tests unitaires y puisent.

### Corrections de provenance

Trois entrées de [CLEANUP_IMAGES.json](CLEANUP_IMAGES.json) pointaient vers des **artefacts de build ignorés par Git** (`apps/coder/dist/`, `apps/desktop/dist-elec/`). Elles désignaient désormais les sources suivies de mêmes empreintes (`apps/coder/public/`, `apps/desktop/build/icon.png`) : `node scripts/check-cleanup.mjs` échouait sur un clone propre, il passe désormais partout.

Les 42 importations relatives de `apps/vibe/lib/**` et `apps/vibe/tests/**` pointaient vers des modules du backend **déplacés à la racine** du dépôt : elles ont été réécrites vers le chemin exact, et l’application Vite de référence est à nouveau résolvable. Le script `check:backend` visait un `main.ts` absent : il vise désormais celui de la racine.

`next.config.ts` ne traçait que `apps/site/docs/news/**` alors que `lib/site/docs.ts` et `lib/site/changelog.ts` lisent le disque à l’exécution : les deux chemins manquants ont été ajoutés aux `outputFileTracingIncludes`, sans quoi un build `standalone` servait `/site/docs` et `/site/changelog` vides.

### Dépendances retirées

Seize dépendances déclarées sans aucun import effectif ont été retirées : `react-icons`, `@vercel/analytics` et `@ai-sdk/provider` (racine) ; `clsx`, `react-icons`, `tailwind-merge`, `tailwindcss-animate` et `vite` (Site) ; `bcryptjs`, `clsx`, `tailwind-merge`, `pg`, `@capacitor/haptics` et `lucide-react` (Vibe) ; `ssh2` (Coder) ; `@capacitor/app` (Mobile). `@vitest/coverage-v8` a également été retiré de la racine — aucun script n’emploie `--coverage` et `vitest.config.ts` ne déclare aucun réglage de couverture ; une mise à jour de dépendances concurrente l’a réintroduit depuis, sans effet à l’exécution.

Ont été **conservés** malgré l’absence d’import direct, parce qu’ils ne sont pas de simples doublons : `@tiptap/pm` (pair requis de `@tiptap/core`), `@opentelemetry/api` et `@opentelemetry/api-logs` (pairs de `@vercel/otel`), `babel-plugin-react-compiler` (exigé par `reactCompiler: true`), `tailwindcss-animate` et `@tailwindcss/typography` (chargés par `@plugin` dans `app/globals.css`), `react-dom` et `sharp` (pairs et optimiseur d’images de Next dans l’application Site autonome). `@ai-sdk/provider` reste par ailleurs épinglé dans `pnpm.overrides` : la version de `ai` reste ainsi fixée.

### Défauts préexistants relevés au passage

Ces anomalies existaient **avant** ce chantier et n’en sont pas la conséquence. Elles sont signalées ici pour que le prochain lecteur ne les attribue pas à tort au nettoyage.

- `node scripts/check-wakies-source.mjs` **échoue** : quatre fichiers de `apps/wakies/apps/mobile/` — `App.tsx`, `src/ui.tsx`, `src/agent-ui.tsx` et `src/screens.tsx` — ont été adaptés localement, mais seuls les deux premiers sont déclarés dans `SOURCE_MANIFEST.json.localAdaptations`. Le vérificateur compare donc les deux adaptations non déclarées à l’empreinte amont et les refuse. La correction relève de la **provenance** (déclarer ces deux adaptations), non du nettoyage : le manifeste n’a pas été touché.
- `apps/vibe` ne typecheck pas : 33 erreurs dans `src/components/common/bookIcons.ts`, où le type `IconProps` de `@mdevs/icons` n’est pas assignable au type local `BookIconComponent`. L’erreur est **identique** avec ou sans le retrait de `lucide-react` et de la déclaration `src/types/lucide-react.d.ts` : `IconProps` est défini par `packages/icons` lui-même, jamais par `lucide-react`.
- `apps/blackline` ne typecheck pas : `src/game.ts` appelle `this.touch?.dispose?.()` alors que le type `TouchInput` ne déclare pas `dispose`. Ces fichiers sont modifiés par un chantier parallèle (démontage du moteur 3D) ; le chantier de nettoyage n’y a pas touché.

## Preuves et exclusions

Le build racine utilise Next et les générateurs Vibe, Wakies et Site. Le paquet `apps/wakies` délègue ses commandes à l’hôte ; le typecheck exclut les apps de référence et Vitest ne collecte pas les tests autonomes OpenMuse. Les générateurs Wakies lisent `integration/web` et les styles du paquet UI, pas les serveurs OpenMuse.

L’audit des références a recherché les chemins supprimés dans le code applicatif, les composants Wakies portés, les scripts, les tests et les configurations de build/typecheck. Aucun chemin vers `apps/wakies/apps/`, `apps/wakies/packages/`, `apps/wakies/tests/` ou les configurations autonomes supprimées n’est référencé par ces points d’entrée. Les seules références opérationnelles à `apps/wakies/` ciblent les sources `integration/web` conservées ; les occurrences historiques restent dans la documentation et les inventaires.

Les services retirés utilisaient une identité mono-propriétaire et leur propre SQLite, worker ou OAuth Google. L’intégration exécutée utilise la session mAI, PostgreSQL et les outils de l’hôte. Les anciennes variables Google ne sont plus proposées comme configuration de Wakies ; aucune connexion Google, Gmail ou Calendar n’est activée par ce nettoyage.

Deux fichiers de l’interface mobile de référence portaient déjà des adaptations locales. Toute cette référence et son domaine partagé restent conservés. Le manifeste garde les empreintes officielles et les empreintes locales exactes de ces deux adaptations ; le vérificateur continue de contrôler les deux provenances.

Les fichiers backend Val Town à la racine, les miroirs CLI sous `scripts/`, les applications Coder, Vibe, Site, Desktop et Mobile mAI et les packages partagés sont conservés. Ils ont des points d’entrée ou des usages indépendants du build Next. Les licences, médias et sources des générateurs restent présents. Les documents historiques sont identifiés comme archives, pas comme procédures de production.

## Images et provenance

Les 2 856 images présentes au début de ce chantier ont été inventoriées par chemin et SHA-256, hors dépendances et caches. [CLEANUP_IMAGES.json](CLEANUP_IMAGES.json) conserve ces empreintes ; `node scripts/check-cleanup.mjs` rejoue le contrôle de présence et de contenu, ainsi que la vérification des retraits. Le contrôle final compare chaque empreinte. Aucune suppression d’image n’est inscrite à l’inventaire des retraits.

Trois entrées de l’inventaire désignaient des **artefacts de build ignorés par Git** (`apps/coder/dist/`, `apps/desktop/dist-elec/`) : le contrôle échouait donc sur un clone propre, faute de ces fichiers. Elles désignent désormais les sources suivies des mêmes images — `apps/coder/public/favicon.png`, `apps/coder/public/logo.png` et `apps/desktop/build/icon.png` — d’empreintes identiques. Aucune image n’a été perdue : les trois sources étaient déjà inventoriées, et ce sont les désignations provisoires qui ont disparu.

Des suppressions d’anciennes mascottes étaient déjà présentes dans l’état initial du dépôt : `blue.png`, `mint.png`, `orange.png`, `purple.png` et `red.png` sous `public/wakies`. Le chantier ne modifie pas ces suppressions antérieures.

Le manifeste OpenMuse distingue `files` (fichiers conservés), `retiredFiles` (empreintes des sources retirées) et `localAdaptations` (références localement adaptées). `node scripts/check-wakies-source.mjs` contrôle les fichiers conservés, interdit le retrait d’images et vérifie que les fichiers déclarés retirés sont absents. Le commit de provenance permet de retrouver les sources autonomes en amont.

## Validation

Le bilan d’exécution du chantier est dans [VALIDATION_MESSAGING.md](3-wakies/VALIDATION_MESSAGING.md). Les contrôles du backend distant et l’application des migrations à la production restent distincts des vérifications locales.
