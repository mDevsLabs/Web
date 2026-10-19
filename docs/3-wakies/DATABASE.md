# 🗄️ Schéma de Base de Données — Wakies

Ce document présente l'architecture des données de Wakies, décrivant la transition de la base SQLite mono-utilisateur d'origine vers les 16 tables relationnelles multi-tenant PostgreSQL (Neon) créées par la migration `0037_wakies.sql`.

---

## 1. 🛡️ Isolation Multi-Tenant par `userId`

Dans le modèle mAI Web, les tables propriétaires portent `userId` (identité mAI vérifiée). Certaines tables enfants, notamment les messages, sont isolées en vérifiant leur conversation ou Wakie propriétaire ; toutes ne portent pas physiquement `userId`, et ce champ texte n’est pas systématiquement une clé étrangère vers `User`.
- Aucune entité ne peut exister sans rattachement explicite à un compte mAI Web.
- Toutes les fonctions du module `lib/wakies/queries.ts` exigent `userId: string` en tout premier argument.

---

## 2. 📋 Les 16 Tables PostgreSQL (`lib/db/schema.ts`)

| Nom de la table | Description & Responsabilité |
|---|---|
| `WakiesSettings` | Préférences globales de l'utilisateur pour l'espace Wakies. |
| `WakiesSpace` | Espaces de travail regroupant des pages et des agents. |
| `WakiesWakie` | Définition des agents coworkers (nom, rôle, avatar, prompt système, permissions). |
| `WakiesWakieSpace` | Table de liaison plusieurs-à-plusieurs entre Wakies et Espaces. |
| `WakiesConversation` | Fils de discussion avec les Wakies (remplace le concept de « thread »). |
| `WakiesMessage` | Messages individuels au format `UIMessage` (AI SDK). |
| `WakiesPage` | Documents éditables Tiptap au sein d'un Espace. |
| `WakiesPageConversation`| Conversations liées directement à une page de travail spécifique. |
| `WakiesPageReview` | Cartes d'approbation préalable HITL (*Approve & save* / *Decline*). |
| `WakiesTask` | Tâches automatisées programmées en arrière-plan. |
| `WakiesTaskRun` | Historique des exécutions d'une tâche avec statut (running, completed, failed). |
| `WakiesTaskEvent` | Événements et journaux horodatés générés pendant l'exécution d'une tâche. |
| `WakiesTaskConversation`| Discussion dédiée créée lors de l'exécution d'une tâche. |
| `WakiesMemory` | Faits et préférences mémorisés de manière persistante par les Wakies. |
| `WakiesCall` | Métadonnées et compte-rendu des sessions vocales en temps réel WebRTC. |
| `WakiesCapture` | Captures d'écran et extractions web réalisées par les outils de recherche. |

---

## 3. 🔄 Comparaison avec le modèle SQLite d'origine

| Caractéristique | Ancien gabarit OpenDots (archivé) | Portage mAI Web (`/wakies`) |
|---|---|---|
| **Moteur** | SQLite local (`node:sqlite`) | PostgreSQL Neon (Serverless) |
| **Multi-utilisateur** | Non (mono-tenant via `OWNER_ID`) | Oui (isolation stricte par `userId`) |
| **Conversations** | CopilotKit Intelligence Cloud | Base locale PG + AI SDK v7 |
| **Tâches planifiées**| `setInterval` en mémoire | Endpoint transactionnel `/api/cron/wakies` |


## Migration OpenMuse et tours de conversation

Les seize tables historiques sont conservées. Les migrations 0041 (modèle/avatar) et 0042 préexistante restent en place. La migration additive 0043 ajoute WakiesChatTurn : propriétaire, conversation, message logique, UUID de réponse, statut et expiration. L’index unique conversation/message et le verrou transactionnel empêchent les doublons ; les lectures sont limitées et filtrées par compte. Aucun contenu historique n’est réécrit ou supprimé. Le journal et scripts/check-db-schema.mjs accompagnent la migration ; aucun DDL au runtime.

Les objectifs simples utilisent WakiesPage et ses révisions, pas une base séparée. Les blobs privés continuent d’utiliser le stockage mAI. Aucune base source OpenMuse n’est créée ou utilisée en production. L’application de 0043 et la validation sur une vraie base sont nécessaires avant déploiement du chat.
