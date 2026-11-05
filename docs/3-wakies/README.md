# Wakies

Wakies est l'espace de travail personnel de mAI, servi sous `/wakies` : Wakies
(agents), Espaces et pages Markdown, tâches, mémoire, fichiers, recherche unifiée
et messagerie. La référence OpenMuse d'origine vit dans
[`apps/wakies/`](../../apps/wakies/README.md), hors du build Next : **la présence
d'un code dans cette référence ne suffit pas à le rendre disponible sous
`/wakies`.**

## Guides vivants — l'état à maintenir

- [INTEGRATION.md](INTEGRATION.md) — port, services remplacés par l'hôte, **capacités
  secondaires non branchées** (voix temps réel, ordinateurs persistants, Slack,
  navigateur isolé, terminal)
- [SETUP.md](SETUP.md) — configuration et prérequis
- [DATABASE.md](DATABASE.md) — tables `Wakies*` et isolation par `userId`
- [MESSAGING.md](MESSAGING.md) — fil, citations, transferts, lecture par `seq`
- [COMPUTERS.md](COMPUTERS.md) — ordinateurs persistants (non activés)
- [AGENTS.md](AGENTS.md) — règles impératives du portage
- [UI_VALIDATION.md](UI_VALIDATION.md) · [VALIDATION_MESSAGING.md](VALIDATION_MESSAGING.md) —
  résultats de validation
- [OPENMUSE_MIGRATION.md](OPENMUSE_MIGRATION.md) · [VALIDATION_OPENMUSE.md](VALIDATION_OPENMUSE.md) —
  cartographie, décisions et validations de la migration
- Contrats et routes : [API_CONTRACTS.json](API_CONTRACTS.json),
  [API_INVENTORY.json](API_INVENTORY.json),
  [CHANGESET_OPENMUSE.json](CHANGESET_OPENMUSE.json)

## Archives — à ne pas appliquer

Les fichiers `HISTORIQUE_*` décrivent l'ancien gabarit OpenDots, remplacé par
OpenMuse. Leurs instructions (Node 24, Docker, `OWNER_TOKEN`, les noms `Dot` et
« OpenDots ») **n'ont plus d'effet ici** ; elles sont conservées pour la
provenance et le vocabulaire.

- [HISTORIQUE_OPENDOTS.md](HISTORIQUE_OPENDOTS.md)
- [HISTORIQUE_SETUP_OPENDOTS.md](HISTORIQUE_SETUP_OPENDOTS.md)
- [HISTORIQUE_COMPUTERS_OPENDOTS.md](HISTORIQUE_COMPUTERS_OPENDOTS.md)
- [Démonstrations historiques](demos/README.md)

## Les trois rupture du port

1. **Comptes** : plus de `OWNER_TOKEN`. C'est le cookie de session mAI qui
   authentifie, et `proxy.ts` protège `/wakies` comme `/api/wakies/**`.
2. **Données** : les SQLite de la référence deviennent des tables PostgreSQL où
   chaque ligne porte `userId` ; `lib/wakies/queries.ts` l'exige en premier
   paramètre.
3. **IA** : le chat passe par le pipeline de l'hôte (`/api/wakies/chat`) et
   consomme le quota du compte. Pas de CopilotKit, pas de `react-markdown`, et le
   planificateur est un tick de cron, plus un `setInterval`.

Le thème suit celui de l'hôte via `.wakies-root` ; les feuilles CSS sont générées
(`node scripts/build-wakies-css.mjs`).
