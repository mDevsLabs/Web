import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const sourcePath = path.resolve("lib/db/queries.ts");
const targetDir = path.resolve("lib/db/queries");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Lire le contenu d'origine depuis Git HEAD pour être parfaitement pur
const originalContent = execSync("git show HEAD:lib/db/queries.ts", {
  maxBuffer: 10 * 1024 * 1024,
}).toString();

let lines = originalContent.split("\n");

// 1. connection.ts (lignes 1 à 1252)
// Corriger les chemins relatifs dans connection.ts :
// - "../constants" -> "@/lib/constants"
// - "../errors" -> "@/lib/errors"
// - "./schema" -> "../schema"
// - "let _rawClient" -> "export let _rawClient"
let connectionLines = lines.slice(0, 1252).map((l) => {
  if (l.includes('from "../constants"')) return l.replace('"../constants"', '"@/lib/constants"');
  if (l.includes('from "../errors"')) return l.replace('"../errors"', '"@/lib/errors"');
  if (l.includes('from "./schema"')) return l.replace('"./schema"', '"../schema"');
  if (l.startsWith("let _rawClient:")) return `export ${l}`;
  return l;
});

fs.writeFileSync(path.join(targetDir, "connection.ts"), connectionLines.join("\n"), "utf8");

// Entête commun propre pour tous les sous-fichiers
const commonHeader = `import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { _rawClient, dbReady, getDb, getRawClient } from "./connection";
import {
  agent,
  agentTemplate,
  type Chat,
  chat,
  customCommand,
  type DBMessage,
  type DocumentProposal,
  document,
  documentProposal,
  mcpLog,
  mcpServer,
  mcpServerSecret,
  message,
  pluginInstallation,
  project,
  projectFile,
  projectInvite,
  projectMember,
  type ScheduledMessage,
  type Skill,
  type Suggestion,
  scheduledMessage,
  skill,
  skillUsage,
  skillVersion,
  stream,
  suggestion,
  toolExecution,
  userMcpPrefs,
  userMemory,
  vote,
} from "../schema";
import { ChatbotError } from "@/lib/errors";
`;

function extractRanges(ranges) {
  const extracted = [];
  for (const [start, end] of ranges) {
    extracted.push(...lines.slice(start - 1, end));
  }
  let text = extracted.join("\n");
  // Remplacer les imports dynamiques relatifs à schema : import("./schema") -> import("../schema")
  text = text.replaceAll('import("./schema")', 'import("../schema")');
  return text;
}

// 1. chats.ts (contient chatUserFilter des lignes 2207 à 2219)
const chatsHeader = `${commonHeader}
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { resolveBillableTotal } from "@/lib/agent/usage";
import { getProjectById } from "./projects";
`;
const chatsBody = extractRanges([[1253, 1509], [2207, 2603], [2885, 3290]]);
fs.writeFileSync(path.join(targetDir, "chats.ts"), `${chatsHeader}\n${chatsBody}`, "utf8");

// 2. projects.ts (se termine à 2206)
const projectsHeader = `${commonHeader}
async function getProjectAccessGuard() {
  return import("@/lib/projects/access");
}
`;
const projectsBody = extractRanges([[1510, 2206]]);
fs.writeFileSync(path.join(targetDir, "projects.ts"), `${projectsHeader}\n${projectsBody}`, "utf8");

// 3. documents.ts
const documentsHeader = `${commonHeader}
import type { ArtifactKind } from "@/components/chat/artifact";
import { getProjectById } from "./projects";
`;
const documentsBody = extractRanges([[2604, 2884]]);
fs.writeFileSync(path.join(targetDir, "documents.ts"), `${documentsHeader}\n${documentsBody}`, "utf8");

// 4. skills.ts
const skillsHeader = `${commonHeader}
`;
const skillsBody = extractRanges([[3291, 3652]]);
fs.writeFileSync(path.join(targetDir, "skills.ts"), `${skillsHeader}\n${skillsBody}`, "utf8");

// 5. mcp.ts
const mcpHeader = `${commonHeader}
import type { ToolCategory } from "@/lib/agent/types";
import {
  redactMcpError,
  redactMcpText,
  redactMcpValue,
} from "@/lib/mcp/redaction";
`;
const mcpBody = extractRanges([[3653, 4300]]);
fs.writeFileSync(path.join(targetDir, "mcp.ts"), `${mcpHeader}\n${mcpBody}`, "utf8");

// 6. notifications.ts
const notifsHeader = `${commonHeader}
`;
const notifsBody = extractRanges([[4301, 4379], [4689, 4857], [5425, 5461]]);
fs.writeFileSync(path.join(targetDir, "notifications.ts"), `${notifsHeader}\n${notifsBody}`, "utf8");

// 7. users.ts
const usersHeader = `${commonHeader}
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { normalizeAppKey } from "@/lib/apps/catalog";
import { normalizeCreationMode } from "@/lib/creation/mode";
import {
  AUTO_DICTATION_LANGUAGE,
  DEFAULT_TRANSLATION_TARGET,
  normalizeDictationLanguage,
  normalizeTranslationTarget,
} from "@/lib/i18n/languages";
import type { ScheduleToolMode } from "@/lib/planning/tool-mode";
import { normalizeScheduleToolMode } from "@/lib/planning/tool-mode";
`;
const usersBody = extractRanges([[4380, 4688], [5164, 5229]]);
fs.writeFileSync(path.join(targetDir, "users.ts"), `${usersHeader}\n${usersBody}`, "utf8");

// 8. agents.ts
const agentsHeader = `${commonHeader}
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { dedupeAgentTemplatesByName } from "@/lib/agent-templates/dedupe";
`;
const agentsBody = extractRanges([[4858, 5018], [5411, 5424], [5620, 5683]]);
fs.writeFileSync(path.join(targetDir, "agents.ts"), `${agentsHeader}\n${agentsBody}`, "utf8");

// 9. memories.ts
const memoriesHeader = `${commonHeader}
import { MEMORY_CONTENT_MAX_LENGTH } from "@/lib/constants";
import { getAgentById } from "./agents";
`;
const memoriesBody = extractRanges([[5019, 5163], [5230, 5410]]);
fs.writeFileSync(path.join(targetDir, "memories.ts"), `${memoriesHeader}\n${memoriesBody}`, "utf8");

// 10. commands.ts
const commandsHeader = `${commonHeader}
`;
const commandsBody = extractRanges([[5462, 5619]]);
fs.writeFileSync(path.join(targetDir, "commands.ts"), `${commandsHeader}\n${commandsBody}`, "utf8");

// 11. planning.ts
const planningHeader = `${commonHeader}
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { type ScheduleToolMode, normalizeScheduleToolMode } from "@/lib/planning/tool-mode";
`;
const planningBody = extractRanges([[5684, lines.length]]);
fs.writeFileSync(path.join(targetDir, "planning.ts"), `${planningHeader}\n${planningBody}`, "utf8");

// 12. Barrel export lib/db/queries.ts
const barrelContent = `import "server-only";

export * from "./queries/connection";
export * from "./queries/chats";
export * from "./queries/projects";
export * from "./queries/documents";
export * from "./queries/skills";
export * from "./queries/mcp";
export * from "./queries/notifications";
export * from "./queries/users";
export * from "./queries/agents";
export * from "./queries/memories";
export * from "./queries/commands";
export * from "./queries/planning";
`;

fs.writeFileSync(sourcePath, barrelContent, "utf8");

console.log("Division de lib/db/queries.ts régénérée avec tous les imports et correctifs !");
