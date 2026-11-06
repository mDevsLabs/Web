# Référence mobile OpenMuse (archive)

Ce dossier est la référence **mobile** du produit amont, OpenMuse : une base de
code React Native / Expo unique pour iOS, Android et un aperçu Web. Elle est
conservée pour la provenance, le vocabulaire et les adaptations locales —
**elle n'est pas construite, ni exécutée, ni déployée par mAI Web**.

Aucune de ses commandes n'est une procédure de mAI. Le produit servi sous
`/wakies` est un port React DOM (`components/wakies/`) branché sur les services
de l'hôte : session mAI, PostgreSQL, pipeline de chat de l'hôte.

## Stack d'origine

`@openmuse/mobile` 0.9.3 — Expo ~54, React 19.1, React Native 0.81.5,
React Native Web ^0.21, hooks headless CopilotKit pour React Native, Zod v4,
TypeScript 5.9. `App.tsx`, `app.json`, `metro.config.js`, `src/`, `test/`.

## Ce que l'archive documente

- **Navigation** : Chat, Activity, Ideas, Goals, Apps (Mail, Calendar, Browser,
  Files, Connections).
- **Chaîne de confiance** : envoyer un mail ou créer, modifier ou supprimer un
  événement exige une proposition enregistrée puis une décision explicite de
  révision ; décliner l'emporte dans un nouveau brouillon.
- **Chat agentique** : reprise du fil AG-UI, cartes d'outils côté frontend,
  interruption et reprise, références de documents. Send et Stop partagent la
  même pastille ; Stop préserve le brouillon.
- **Documents** : les PDF utilisaient `react-native-pdf` et
  `react-native-blob-util` dans un **development build** — Expo Go n'embarque pas
  ces modules natifs. L'aperçu Web utilisait le lecteur PDF du navigateur.
- **Fuseaux** : les modifications du calendrier préservent les fuseaux nommés ;
  la saisie refuse les heures inexistantes au changement d'heure.

## Pourquoi ce README n'est plus en anglais

Le texte d'origine décrivait un serveur Hono, un `OWNER_TOKEN` et un workspace
Launch studio. Ces services ont été **retirés du dépôt** (`apps/server`,
`apps/worker`, `apps/computer`, `packages/backends`, `packages/integrations` sont
vides). Laisser les instructions telles quelles ferait chercher un serveur qui
n'existe plus. Les captures et vidéos d'époque restent dans
`../assets/demos/`.

## Liens

- [Racine de la référence Wakies](../../README.md)
- [Port et capacités réellement branchées](../../../../docs/3-wakies/INTEGRATION.md)
- [Règles du domaine](../../../../docs/3-wakies/AGENTS.md)
