#!/usr/bin/env node
/**
 * Garde de schéma : vérifie que la base cible contient les tables et colonnes
 * critiques attendues par le code déployé. À exécuter AVANT chaque déploiement
 * (preview et production) : un schéma obsolète fait échouer le job avec un
 * message explicite au lieu de déployer un code qui répondra 500 sur toutes
 * les routes base (bug « l'IA ne répond pas, aucun appel API »).
 *
 * Usage : node scripts/check-db-schema.mjs [fichier-env...]
 *   - Lit DATABASE_URL ou POSTGRES_URL depuis l'environnement, sinon depuis
 *     les fichiers env passés en argument (défaut : .env.local, .env).
 *   - Sortie silencieuse en cas de succès ; diagnostic détaillé en échec.
 *   - Code de sortie 1 si une table/colonne critique manque.
 */

import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

// Tables absolument requises par les routes /api/chat et /api/agent. Toute
// absence produit un 500 avant l'appel au modèle IA.
const REQUIRED_TABLES = [
  "WakiesNotification",
  "AgentRun",
  "AgentSchedule",
  "AgentScheduleVersion",
  "AgentStep",
  "AgentUserInputRequest",
  "Project",
  "ProjectMember",
  "Skill",
  "ToolExecution",
  "user_notification_prefs",
  "user_preferences",
  "UsageEvent",
  "Message_v2",
  "Stream",
  "ScheduledMessage",
  "UserMemory",
  // Migration 0051 : sans cette table, `POST /api/integration/<provider>/callback`
  // échoue en 42703 APRÈS avoir validé le code chez le fournisseur : l'utilisateur
  // a consenti sur l'écran Google mais son compte n'est jamais connecté.
  "IntegrationConnection",
  // Wakies (migration 0037) : sans ces tables, /wakies répond 500 dès le
  // premier chargement de l'espace de travail, et l'application n'affiche
  // qu'un écran de chargement infini.
  "WakiesChatTurn",
  "WakiesCall",
  "WakiesCapture",
  "WakiesConversation",
  "WakiesMemory",
  "WakiesMessage",
  "WakiesPage",
  "WakiesPageConversation",
  "WakiesPageReview",
  "WakiesSettings",
  "WakiesSpace",
  "WakiesTask",
  "WakiesTaskConversation",
  "WakiesTaskEvent",
  "WakiesTaskRun",
  "WakiesWakie",
  "WakiesWakieProfile",
  "WakiesWakieImage",
  "WakiesFriend",
  "WakiesConversationMember",
  "WakiesMessageReaction",
  "WakiesWakieSpace",
  // Migration 0054 : formulaires utilisateur et récompenses de réinitialisation
  "UserForm",
  "UserFormResponse",
];

// Colonnes introduites par des migrations récentes : détecte une base partiellement migrée.
const REQUIRED_COLUMNS = [
  { column: "rewardResetApplied", table: "UserFormResponse" },
  { column: "rewardType", table: "UserFormResponse" },
  { column: "questions", table: "UserForm" },
  { column: "isActive", table: "UserForm" },
  ...["seq", "userId", "conversationId", "messageId"].map((column) => ({
    column,
    table: "WakiesNotification",
  })),
  { column: "actorKey", table: "WakiesMessageReaction" },
  { column: "favorite", table: "WakiesConversation" },
  { column: "muted", table: "WakiesConversation" },
  ...[
    "userId",
    "conversationId",
    "messageId",
    "responseId",
    "status",
    "expiresAt",
  ].map((column) => ({ column, table: "WakiesChatTurn" })),
  { column: "agentApprovalRequired", table: "user_notification_prefs" },
  { column: "executionOwner", table: "AgentRun" },
  { column: "executionLeaseUntil", table: "AgentRun" },
  { column: "isEnabled", table: "UserMemory" },
  { column: "isImportant", table: "UserMemory" },
  { column: "planningTaskCompleted", table: "user_notification_prefs" },
  { column: "quotaWarning", table: "user_notification_prefs" },
  { column: "stopReason", table: "AgentRun" },
  { column: "parentRunId", table: "AgentRun" },
  { column: "scheduleVersionId", table: "AgentScheduleOccurrence" },
  { column: "tags", table: "UserMemory" },
  // Migration 0030 : écran chargé à chaque arrivée sur l'accueil, et
  // décomposition du quota (les tokens de réflexion sont un sous-ensemble des
  // tokens de sortie : ils sont comptés, mais gardés à part).
  { column: "defaultMode", table: "AgentSettings" },
  { column: "reasoningTokens", table: "UsageEvent" },
  // Migration 0033 : la page Statistiques est la première lecture de
  // `UsageEvent`. Sans ce lien, ses filtres « projet » et « mode » ne sont pas
  // exprimables en SQL et la page ne peut pas fonctionner du tout.
  { column: "chatId", table: "UsageEvent" },
  // Migration 0034 : la dictée vocale et le bouton « Traduire » lisent leurs
  // valeurs dans cette table. Sans ces colonnes, `getUserPreferences`
  // sélectionne des colonnes inexistantes et TOUTE la page des paramètres
  // tombe en 42703 — pas seulement les deux réglages nouveaux.
  { column: "defaultDictationLanguage", table: "user_preferences" },
  { column: "defaultTranslationLanguage", table: "user_preferences" },
  // Migration 0038 : le menu favori (mAI / Site / Vibe / Code) est lu à chaque
  // requête de préférences ; une colonne absente ferait tomber la page
  // Paramètres comme en 0034.
  { column: "defaultApp", table: "user_preferences" },
  { column: "defaultCreationMode", table: "user_preferences" },
  // Migration 0056 : le thème partagé est lu à chaque chargement par mAI,
  // Vibe, le Site et Wakies. Une colonne absente ferait tomber la lecture des
  // préférences en 42703 comme en 0034/0038.
  { column: "theme", table: "user_preferences" },
  // Migration 0057 : effort de réflexion global dans user_preferences.
  { column: "reasoningLevel", table: "user_preferences" },
  // Migration 0035 : sans `chatMode`/`chatProjectId`, la page Statistiques
  // retombe sur une jointure `Chat` et les tokens d'une conversation
  // SUPPRIMÉE disparaissent de l'historique — le filtre « mode » ferait
  // chuter le total de tokens sans raison visible.
  { column: "chatMode", table: "UsageEvent" },
  { column: "chatProjectId", table: "UsageEvent" },
  // Migration 0036 : sans `ToolExecution.chatId`/`userId`, les appels de
  // plugins du mode Chat ne sont pas journalisés et le classement « Outils les
  // plus utilisés » affiche 0 exécution pour un plugin très utilisé en Chat.
  { column: "chatId", table: "ToolExecution" },
  { column: "userId", table: "ToolExecution" },
  // Migration 0041 : `GET /api/wakies/workspace` sélectionne toute la ligne du
  // Wakie et de ses conversations. Une colonne absente fait répondre 500 au
  // premier chargement de /wakies (écran de chargement infini), et le chat ne
  // peut plus ni choisir son modèle ni journaliser le bon.
  { column: "model", table: "WakiesWakie" },
  { column: "avatar", table: "WakiesWakie" },
  // Migration 0044 : groupes, épingles et réactions.
  { column: "isGroup", table: "WakiesConversation" },
  { column: "pinned", table: "WakiesMessage" },
  { column: "pinnedAt", table: "WakiesMessage" },
  { column: "isOrganizer", table: "WakiesConversationMember" },
  { column: "emoji", table: "WakiesMessageReaction" },
  { column: "model", table: "WakiesConversation" },
  // Migration 0047 : l'annuaire, les fiches publiques et le clonage lisent la
  // persona PUBLIÉE. Une colonne absente fait répondre 500 à la recherche
  // globale, et `clonedFromWakieId` à la création d'un clone.
  { column: "publicPersona", table: "WakiesWakie" },
  { column: "clonedFromWakieId", table: "WakiesWakie" },
  // Migration 0048 : la liste des conversations sélectionne toute la ligne.
  // Sans `lastReadSeq`, le premier chargement de /wakies répond 500 — et le
  // compteur de non-lus n'a plus de sens à porter.
  { column: "lastReadSeq", table: "WakiesConversation" },
  // Migration 0042 : `GET /api/wakies/workspace` sélectionne désormais les
  // colonnes de sélection d'outils, et la configuration de départ lit
  // `onboardingCompleted`. Une colonne absente fait répondre 500 au premier
  // chargement de /wakies : plus d'espace de travail, plus de chat, plus
  // d'assistant — l'application entière est inutilisable.
  { column: "onboardingCompleted", table: "WakiesSettings" },
  { column: "mcpServerIds", table: "WakiesWakie" },
  { column: "pluginIds", table: "WakiesWakie" },
  { column: "skillIds", table: "WakiesWakie" },
  { column: "skillParams", table: "WakiesWakie" },
  { column: "toolIds", table: "WakiesWakie" },
  { column: "mcpServerIds", table: "WakiesConversation" },
  { column: "pluginIds", table: "WakiesConversation" },
  { column: "skillIds", table: "WakiesConversation" },
  { column: "skillParams", table: "WakiesConversation" },
  { column: "toolIds", table: "WakiesConversation" },
  // Migration 0046 : la récurrence planifiée est devenue calendaire. Sans ces
  // colonnes, `buildScheduleFromRecord` ne peut pas reconstruire l'heure
  // murale des tâches récurrentes et chaque reprogrammation dérive.
  { column: "timezone", table: "ScheduledMessage" },
  { column: "hour", table: "ScheduledMessage" },
  { column: "minute", table: "ScheduledMessage" },
  { column: "dayOfMonth", table: "ScheduledMessage" },
  { column: "monthlyPolicy", table: "ScheduledMessage" },
  // Migration 0051 : la carte « Connecté » de l'onglet Plugins lit `provider`,
  // `accountLabel`, `scopes` et `expiresAt` sans déchiffrer quoi que ce soit, et
  // `accessToken` porte leBearer de chaque appel d'outil. Une de ces colonnes
  // absente fait répondre 500 à /api/integration et échouer le callback après
  // le consentement — le compte est connecté chez Google et introuvable ici.
  { column: "userId", table: "IntegrationConnection" },
  { column: "provider", table: "IntegrationConnection" },
  { column: "providerAccountId", table: "IntegrationConnection" },
  { column: "accountLabel", table: "IntegrationConnection" },
  { column: "accessToken", table: "IntegrationConnection" },
  { column: "refreshToken", table: "IntegrationConnection" },
  { column: "scopes", table: "IntegrationConnection" },
  { column: "expiresAt", table: "IntegrationConnection" },
  { column: "isPrimary", table: "IntegrationConnection" },
  { column: "revokedAt", table: "IntegrationConnection" },
  // Migration 0052 : le tick cron lit `attempt` et `claimedBy` dans la requête
  // même qui revendique. Une colonne absente fait échouer claimDueTask en 42703
  // AVANT tout appel de modèle — les tâches récurrentes ne partent plus, sans
  // aucun message côté utilisateur.
  { column: "attempt", table: "WakiesTask" },
  { column: "claimedBy", table: "WakiesTask" },
  // Migration 0053 : le rail sélectionne les Espaces avec `pinned` et les trie
  // dessus, et la mention `@@` écrit le contexte persistant du fil. Une colonne
  // `WakiesSpace` absente fait répondre 500 à `GET /api/wakies/workspace` —
  // donc à toute ouverture de /wakies ; une colonne `context*Ids` absente fait
  // échouer `updateConversation` en 42703 au premier `@@` envoyé.
  { column: "pinned", table: "WakiesSpace" },
  { column: "updatedAt", table: "WakiesSpace" },
  { column: "contextPageIds", table: "WakiesConversation" },
  { column: "contextSpaceIds", table: "WakiesConversation" },
  { column: "contextWakieIds", table: "WakiesConversation" },
  // Migration 0055 : la bibliothèque de pages trie ses cartes sur `pinned` et
  // lit les réglages de rendu dans `settings`. `listPages` échoue en 42703 sans
  // ces colonnes — donc à toute ouverture d'un Espace.
  { column: "pinned", table: "WakiesPage" },
  { column: "settings", table: "WakiesPage" },
];

// `mprojects_api_keys` (et sa colonne `key_name`, migration 0040) est
// volontairement ABSENTE de cette garde : aucune migration journalisée ne crée
// cette table — seul le 0040 fait un `ALTER TABLE IF EXISTS` dessus, et elle est
// créée hors Drizzle par le backend. L'y exiger rendrait le contrôle bloquant
// rouge sur tout environnement où la table n'existe pas, ce qui est pire que
// l'absence de garde. La protection réelle de `key_name` est le contrat
// tests/unit/api-key-migration-safety.test.ts.

const REQUIRED_INDEXES = [
  "UsageEvent_userId_createdAt_idx",
  "UsageEvent_chatId_idx",
  "Message_v2_chatId_createdAt_id_idx",
  "Stream_chatId_createdAt_idx",
  "ScheduledMessage_userId_status_scheduledAt_idx",
  // Migrations 0035 et 0036 : les deux lectures les plus fréquentes de la page
  // Statistiques (tokens filtrés par mode, appels d'outils du chemin Chat).
  "UsageEvent_userId_chatMode_createdAt_idx",
  "ToolExecution_userId_createdAt_idx",
  // Migration 0051 : l'unicité (compte, fournisseur, compte fournisseur) est ce
  // qui rend un re-consentement idempotent ; sans elle, deux lignes coexistent
  // et getPrimaryConnection choisit un jeton que l'utilisateur a révoqué.
  "IntegrationConnection_userId_provider_accountId_key",
  "IntegrationConnection_userId_provider_idx",
  // Migration 0052 : le tick scanne (status, leaseUntil) pour reprendre les baux
  // expirés, sur tous les comptes à chaque passage. Sans cet index, c'est une
  // lecture séquentielle de WakiesTask toutes les cinq minutes.
  "WakiesTask_status_leaseUntil_idx",
  // Migration 0053 : la liste du rail trie les Espaces du compte par épingle
  // puis par création, à chaque chargement de /wakies.
  "WakiesSpace_userId_pinned_createdAt_idx",
  // Migration 0055 : la bibliothèque liste les pages D'UN espace et les trie par
  // épingle ; sans cet index, chaque ouverture d'Espace relit tout `WakiesPage`.
  "WakiesPage_spaceId_pinned_idx",
];

const envFiles =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [".env.local", ".env"];

let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
databaseUrl = databaseUrl
  .trim()
  .replace(/^("')+/, "")
  .replace(/(["'])+$/, "")
  .trim();
if (!databaseUrl) {
  for (const file of envFiles) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    const match = content.match(
      /(?:DATABASE_URL|POSTGRES_URL)\s*=\s*"?([^"\n]+)"?/
    );
    if (match) {
      databaseUrl = match[1].trim();
      break;
    }
  }
}

if (!databaseUrl) {
  console.error(
    "::error::DATABASE_URL/POSTGRES_URL introuvable (environnement ni fichiers env)."
  );
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

let target = "(cible inconnue)";
try {
  target = new URL(databaseUrl).host;
} catch {
  // URL non standard : on affiche simplement qu'elle a été fournie.
}

const missingTables = [];
const missingColumns = [];
const missingIndexes = [];

try {
  // Liste complète des tables du schéma public (~140 lignes) : on filtre en JS
  // pour éviter les subtilités d'interpolation de listes de postgres.js.
  const allTables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  const foundTableSet = new Set(allTables.map((row) => row.table_name));
  for (const table of REQUIRED_TABLES) {
    if (!foundTableSet.has(table)) missingTables.push(table);
  }

  const indexes = await sql`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;
  const foundIndexSet = new Set(indexes.map((row) => row.indexname));
  for (const index of REQUIRED_INDEXES) {
    if (!foundIndexSet.has(index)) missingIndexes.push(index);
  }

  for (const { column, table } of REQUIRED_COLUMNS) {
    const found = await sql`
      SELECT c.column_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = ${table}
        AND c.column_name = ${column}
      LIMIT 1
    `;
    if (found.length === 0) missingColumns.push(`${table}.${column}`);
  }

  if (
    missingTables.length > 0 ||
    missingColumns.length > 0 ||
    missingIndexes.length > 0
  ) {
    console.error(
      `::error::Schéma de base obsolète sur ${target} : migrations non appliquées.`
    );
    if (missingTables.length > 0) {
      console.error(
        `::error::Tables manquantes : ${missingTables.join(", ")}. Exécutez \`pnpm exec tsx lib/db/migrate.ts\` avec le DATABASE_URL de CET environnement avant de déployer.`
      );
    }
    if (missingColumns.length > 0) {
      console.error(
        `::error::Colonnes manquantes : ${missingColumns.join(", ")}.`
      );
    }
    if (missingIndexes.length > 0) {
      console.error(`::error::Index manquants : ${missingIndexes.join(", ")}.`);
    }
    process.exit(1);
  }

  console.log(
    `✓ Schéma de base OK sur ${target} (${REQUIRED_TABLES.length} tables, ${REQUIRED_COLUMNS.length} colonnes critiques vérifiées).`
  );
} catch (error) {
  console.error(
    `::error::Vérification du schéma impossible sur ${target} : ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
} finally {
  await sql.end();
}
