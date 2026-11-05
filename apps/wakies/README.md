# Wakies — référence OpenMuse et intégration mAI

L'interface exécutée n'est **pas** ici : elle vit dans `components/wakies/`, le
domaine dans `lib/wakies/`, les routes dans `app/(wakies)/wakies` et
`app/(chat)/api/wakies/`. Ce dossier est la **source de référence** du port et un
point de délégation.

## Ce paquet ne construit rien

`package.json` (`@mdevs/wakies`) est une façade qui renvoie à l'hôte :

| Commande | Fait réellement |
| --- | --- |
| `pnpm dev` / `build` / `typecheck` | `pnpm --dir ../.. …` — lance le build **Next racine** |
| `pnpm test` | `vitest run tests/unit/wakies` dans l'hôte |
| `pnpm source:check` | `node ../../scripts/check-wakies-source.mjs` — vérifie la provenance |

Aucune application Expo ni Hono n'est lancée par le build Next.

## Ce que contient l'arbre

- **`integration/web/`** — `style.css` et `editor.css`, **sources** du générateur
  `node scripts/build-wakies-css.mjs`, qui produit `components/wakies/wakies.css`
  et `wakies-editor.css` ré-ancrés sous `.wakies-root`. C'est là qu'on corrige le
  style, jamais dans la sortie.
- **`apps/mobile/`** — la référence mobile Expo/Radio Native d'OpenMuse, conservée
  et adaptée localement. [Son README](apps/mobile/README.md) décrit l'archive, pas
  une procédure de mAI.
- **`packages/domain/`** — le domaine partagé conservé avec la référence mobile.
- **`assets/`** — images et démonstrations d'origine.
- **`apps/server`, `apps/worker`, `apps/computer`, `packages/backends`,
  `packages/integrations`, `infra`, `patches`, `tests`** — **retirés** : répertoires
  vides, marqueurs d'un périmètre abandonné.

Les services autonomes, leurs tests, leur CI et leurs configurations
mono-propriétaire ont été supprimés. Il n'y a plus de `OWNER_TOKEN` ni de
configuration Google OAuth OpenMuse à saisir : **Wakies utilise la session mAI**.

## Provenance et licence

`PROVENANCE.json` enregistre le dépôt amont (CopilotKit/OpenMuse), le commit
d'origine, la licence MIT, et distingue ce qui est **conservé**, **référence
seulement**, **retiré** ou **remplacé**. `SOURCE_MANIFEST.json` porte les
empreintes SHA-256 des fichiers ; `scripts/check-wakies-source.mjs` les contrôle
et refuse un dépôt Git imbriqué. `LICENSE` (MIT, OpenMuse 2026) et
`integration/web/NOTICE_OPENDOTS.txt` sont conservés avec les médias.

Ne pas réintroduire une configuration mono-propriétaire, ni des variables Google
comme moyen d'authentification mAI.

## Ce que le port a réellement branché

Authentification par cookie de session mAI, tables PostgreSQL portant `userId`,
quota IA du compte (aucun quota séparé), chat via le pipeline de l'hôte
(`/api/wakies/chat`, `useChat` et Streamdown — pas de CopilotKit, pas de
`react-markdown`), planificateur par tick `app/api/cron/wakies`, recherche
unifiée **côté serveur**.

**Pas encore branché**, et `lib/wakies/setup.ts` l'annonce honnêtement : voix temps
réel, ordinateurs persistants (OpenBot), Slack, navigateur isolé, terminal,
worker. Les connecteurs Gmail et Calendar ne sont plus des connecteurs. La
présence d'un code dans cet arbre ne suffit pas à le rendre disponible sous
`/wakies`.

Installation, migrations et messagerie :
[docs/3-wakies/INTEGRATION.md](../../docs/3-wakies/INTEGRATION.md) et
[MESSAGING.md](../../docs/3-wakies/MESSAGING.md). Détail du nettoyage :
[docs/CLEANUP.md](../../docs/CLEANUP.md).
