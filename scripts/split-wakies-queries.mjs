import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const sourcePath = path.resolve("lib/wakies/queries.ts");
const targetDir = path.resolve("lib/wakies/queries");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Supprimer helpers.ts s'il existe
const helpersPath = path.join(targetDir, "helpers.ts");
if (fs.existsSync(helpersPath)) {
  fs.unlinkSync(helpersPath);
}

// Lire le contenu d'origine depuis Git HEAD
const originalContent = execSync("git show HEAD:lib/wakies/queries.ts", {
  maxBuffer: 10 * 1024 * 1024,
}).toString();

const lines = originalContent.split("\n");

function extractLines(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

// Entête partagé
const commonHeader = `import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import {
  wakiesCall,
  wakiesCapture,
  wakiesChatTurn,
  wakiesConversation,
  wakiesFriend,
  wakiesMemory,
  wakiesMessage,
  wakiesMessageReaction,
  wakiesNotification,
  wakiesPage,
  wakiesPageConversation,
  wakiesPageReview,
  wakiesSettings,
  wakiesSpace,
  wakiesTask,
  wakiesTaskConversation,
  wakiesTaskEvent,
  wakiesTaskRun,
  wakiesWakie,
  wakiesWakieImage,
  wakiesWakieProfile,
  wakiesWakieSpace,
} from "@/lib/db/schema";
import type { PageSettings } from "@/lib/wakies/pages";
import { preserveGoalMarker } from "@/lib/wakies/shared/goals";
import { apercuMessage } from "@/lib/wakies/shared/messages";
import {
  prochaineExecution,
  STATUT_TACHE,
  TACHE_BAIL_MS,
  TACHE_MAX_TENTATIVES,
  tentativesEpuisees,
} from "@/lib/wakies/task-lease";
import type {
  SetupStatus,
  WakieCallRow,
  WakieConversationRow,
  WakieMemoryRow,
  WakiePageRow,
  WakieRow,
  WakieSettingsRow,
  WakieSpaceRow,
  WakieTaskEventRow,
  WakieTaskRow,
  WakieTaskRunRow,
  WakieWithSpaces,
} from "./types";
`;

// 1. types.ts (lignes 72 à 95)
const typesBody = `import type {
  wakiesCall,
  wakiesConversation,
  wakiesMemory,
  wakiesPage,
  wakiesSettings,
  wakiesSpace,
  wakiesTask,
  wakiesTaskEvent,
  wakiesTaskRun,
  wakiesWakie,
} from "@/lib/db/schema";

${extractLines(72, 95)}
`;
fs.writeFileSync(path.join(targetDir, "types.ts"), typesBody, "utf8");

// 2. settings.ts (lignes 96 à 156)
fs.writeFileSync(path.join(targetDir, "settings.ts"), `${commonHeader}\n${extractLines(96, 156)}`, "utf8");

// 3. spaces.ts (lignes 157 à 342)
fs.writeFileSync(path.join(targetDir, "spaces.ts"), `${commonHeader}\n${extractLines(157, 342)}`, "utf8");

// 4. wakies.ts (lignes 343 à 676)
// Exporter hashCompte
let wakiesBody = extractLines(343, 676);
wakiesBody = wakiesBody.replace("function hashCompte(", "export function hashCompte(");
const wakiesHeader = `${commonHeader}
import { spaceExists } from "./spaces";
`;
fs.writeFileSync(path.join(targetDir, "wakies.ts"), `${wakiesHeader}\n${wakiesBody}`, "utf8");

// 5. conversations.ts (lignes 677 à 990)
const conversationsHeader = `${commonHeader}
import { findWakie } from "./wakies";
`;
fs.writeFileSync(path.join(targetDir, "conversations.ts"), `${conversationsHeader}\n${extractLines(677, 990)}`, "utf8");

// 6. messages.ts (lignes 991 à 1143)
// Exporter ownedConversationIds
let messagesBody = extractLines(991, 1143);
messagesBody = messagesBody.replace("async function ownedConversationIds(", "export async function ownedConversationIds(");
fs.writeFileSync(path.join(targetDir, "messages.ts"), `${commonHeader}\n${messagesBody}`, "utf8");

// 7. pages.ts (lignes 1144 à 1567)
const pagesHeader = `${commonHeader}
import { spaceExists } from "./spaces";
`;
fs.writeFileSync(path.join(targetDir, "pages.ts"), `${pagesHeader}\n${extractLines(1144, 1567)}`, "utf8");

// 8. tasks.ts (lignes 1568 à 2065)
const tasksHeader = `${commonHeader}
import { findConversation } from "./conversations";
import { ensureSettings } from "./settings";
`;
fs.writeFileSync(path.join(targetDir, "tasks.ts"), `${tasksHeader}\n${extractLines(1568, 2065)}`, "utf8");

// 9. runtime.ts (lignes 2066 à 2342)
const runtimeHeader = `${commonHeader}
import { findConversation } from "./conversations";
import { hashCompte } from "./wakies";
`;
fs.writeFileSync(path.join(targetDir, "runtime.ts"), `${runtimeHeader}\n${extractLines(2066, 2342)}`, "utf8");

// 10. social.ts (lignes 2343 à 3189)
const socialHeader = `${commonHeader}
import { createWakie, findWakie, hashCompte, listWakies } from "./wakies";
import { ownedConversationIds } from "./messages";
`;
fs.writeFileSync(path.join(targetDir, "social.ts"), `${socialHeader}\n${extractLines(2343, 3189)}`, "utf8");

// 11. messaging.ts (lignes 3190 à 3489)
const messagingHeader = `${commonHeader}
import { appendMessages, messageExists } from "./messages";
import { touchConversation } from "./conversations";
`;
fs.writeFileSync(path.join(targetDir, "messaging.ts"), `${messagingHeader}\n${extractLines(3190, 3489)}`, "utf8");

// 12. Barrel export dans lib/wakies/queries.ts
const barrelContent = `import "server-only";

export * from "./queries/types";
export * from "./queries/settings";
export * from "./queries/spaces";
export * from "./queries/wakies";
export * from "./queries/conversations";
export * from "./queries/messages";
export * from "./queries/pages";
export * from "./queries/tasks";
export * from "./queries/runtime";
export * from "./queries/social";
export * from "./queries/messaging";
`;

fs.writeFileSync(sourcePath, barrelContent, "utf8");

console.log("Division de lib/wakies/queries.ts complétée avec export direct des helpers !");
