import type { UIMessageStreamWriter } from "ai";
import { askUser } from "@/lib/ai/tools/ask-user";
import { audioGenerate } from "@/lib/ai/tools/audio-generate";
import { audioPodcast } from "@/lib/ai/tools/audio-podcast";
import { calculator } from "@/lib/ai/tools/calculator";
import { calendarReminder } from "@/lib/ai/tools/calendar-reminder";
import { codeExecution } from "@/lib/ai/tools/code-execution";
import { createDocument } from "@/lib/ai/tools/create-document";
import { cryptoTools } from "@/lib/ai/tools/crypto-tools";
import { currencyConverter } from "@/lib/ai/tools/currency-converter";
import { dateTime } from "@/lib/ai/tools/datetime";
import { documentParser } from "@/lib/ai/tools/document-parser";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { generateChart } from "@/lib/ai/tools/generate-chart";
import { generateDiagram } from "@/lib/ai/tools/generate-diagram";
import { getAccountUsage } from "@/lib/ai/tools/get-account-usage";
import { getUsageStatsTool } from "@/lib/ai/tools/get-usage-stats";
import { imageGenerate } from "@/lib/ai/tools/image-generate";
import { memory } from "@/lib/ai/tools/memory";
import { note } from "@/lib/ai/tools/note";
import { qrCodeGenerator } from "@/lib/ai/tools/qr-code-generator";
import { readUrl } from "@/lib/ai/tools/read-url";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateAccountProfile } from "@/lib/ai/tools/update-account-profile";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { updateProfilePicture } from "@/lib/ai/tools/update-profile-picture";
import { webCapture } from "@/lib/ai/tools/web-capture";
import { webSearch } from "@/lib/ai/tools/web-search";
import type { MaiUser } from "@/lib/auth/session";
import { logChatToolExecution } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";

export type ChatToolDeps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
  /**
   * Conversation porteuse de la requête. `null` pour une conversation pas encore
   * persistée : les exécutions d'outils sont alors journalisées sans lien, ce
   * qui les rend comptables pour le compte mais non rattachables à une
   * conversation. Rien n'est perdu, et `ToolExecution.chatId` n'est pas une clé
   * étrangère — donc aucune écriture ne peut échouer sur une ligne `Chat`
   * absente.
   */
  chatId: string | null;
  sessionToken: string;
  userId: string;
  userEmail: string;
  isGhostMode: boolean;
  chatModel: string;
  maiUser: MaiUser;
  memoryActive: boolean;
  memoryAllowAdd: boolean;
  memoryLimit: number;
  effectiveAgentId: string | null;
};

/**
 * Enveloppe les outils de PLUGIN du canal Chat pour journaliser chaque exécution
 * dans `ToolExecution` (migration 0036).
 *
 * Pourquoi seulement les plugins : le MCP du Chat est DÉJÀ journalisé, dans
 * `McpLog`, par `createMcpChatTools` (lib/mcp/chat-tools.ts) — durée, entrée,
 * sortie, statut d'approbation. Écrire aussi ces appels dans `ToolExecution`
 * ferait compter chaque appel MCP deux fois dans le classement « Outils les
 * plus utilisés », qui lit les deux tables. Les plugins, eux, n'étaient tracés
 * nulle part : c'est le trou que cette fonction comble.
 *
 * Le journal est best-effort : une écriture ratée est avalée, jamais relancée
 * dans le chemin de l'appel. Le résultat de l'outil est RENDU TEL QUEL, valeur
 * d'origine et non une enveloppe — le modèle ne doit pas voir de différence, et
 * un plugin qui renvoie `{ error }` doit continuer de renvoyer `{ error }`.
 *
 * Un outil sans `execute` est renvoyé tel quel : il peut s'agir d'un outil
 * d'approbation, qui n'exécute rien tant que l'utilisateur n'a pas validé, et
 * l'envelopper créerait un faux comptage.
 */
function tracePluginTools(
  tools: Record<string, any>,
  context: { chatId: string | null; userId: string }
): Record<string, any> {
  const traced: Record<string, any> = {};
  for (const [toolId, tool] of Object.entries(tools)) {
    const execute = tool?.execute;
    if (typeof execute !== "function") {
      traced[toolId] = tool;
      continue;
    }
    traced[toolId] = {
      ...tool,
      execute: async (args: unknown, options: unknown) => {
        const startedAt = Date.now();
        try {
          const output = await execute(args, options);
          // `.catch` et non `await` : le journal ne doit pas retarder la
          // réponse ni, en cas de panne de la base, faire échouer l'appel dont
          // la valeur est déjà prête.
          void logChatToolExecution({
            category: "plugins",
            chatId: context.chatId,
            durationMs: Date.now() - startedAt,
            input: args,
            output,
            status: "completed",
            toolId,
            userId: context.userId,
          }).catch(() => {});
          return output;
        } catch (error) {
          void logChatToolExecution({
            category: "plugins",
            chatId: context.chatId,
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
            input: args,
            status: "failed",
            toolId,
            userId: context.userId,
          }).catch(() => {});
          throw error;
        }
      },
    };
  }
  return traced;
}

export function createChatTools(
  deps: ChatToolDeps,
  mcpTools: Record<string, any>,
  pluginTools: Record<string, any> = {}
) {
  const {
    chatId,
    dataStream,
    sessionToken,
    userId,
    userEmail,
    isGhostMode,
    chatModel,
    maiUser,
    memoryActive,
    memoryAllowAdd,
    memoryLimit,
    effectiveAgentId,
  } = deps;

  const userSession = {
    user: isGhostMode ? null : { email: userEmail, id: userId },
  } as any;

  const userSessionWithToken = {
    token: sessionToken,
    user: isGhostMode
      ? null
      : { email: userEmail, id: userId, token: sessionToken },
  } as any;

  // Ordre de fusion : les outils de plugins et de serveurs MCP sont injectés EN
  // PREMIER, les outils natifs ensuite. Un outil natif ne peut donc jamais être
  // masqué par un plugin (la validation interdit déjà toute collision
  // d'identifiant ; cet ordre rend l'invariant explicite et testable).
  return {
    ...tracePluginTools(pluginTools, { chatId, userId }),
    ...mcpTools,
    askUser,
    audioGenerate: audioGenerate({
      dataStream,
      session: userSessionWithToken,
    }),
    audioPodcast: audioPodcast({
      dataStream,
      session: userSessionWithToken,
    }),
    calculator,
    calendarReminder,
    codeExecution,
    createDocument: createDocument({
      dataStream,
      modelId: chatModel,
      session: userSession,
    }),
    cryptoTools,
    currencyConverter,
    dateTime,
    documentParser,
    editDocument: editDocument({
      dataStream,
      session: userSession,
    }),
    generateChart,
    generateDiagram,
    getAccountUsage: getAccountUsage({ maiUser, sessionToken }),
    getUsageStats: getUsageStatsTool({
      userEmail,
      userId: isGhostMode ? null : userId,
    }),
    ...(isGhostMode
      ? {}
      : {
          imageGenerate: imageGenerate({
            dataStream,
            session: userSessionWithToken,
          }),
          updateAccountProfile: updateAccountProfile({ maiUser }),
          updateProfilePicture: updateProfilePicture(),
        }),
    ...(memoryActive
      ? {
          memory: memory({
            agentId: effectiveAgentId,
            allowAdd: memoryAllowAdd,
            memoryLimit,
            userId,
          }),
        }
      : {}),
    note: note({
      dataStream,
      session: userSession,
    }),
    qrCodeGenerator,
    readUrl,
    requestSuggestions: requestSuggestions({
      dataStream,
      modelId: chatModel,
      session: userSession,
    }),
    updateDocument: updateDocument({
      dataStream,
      modelId: chatModel,
      session: userSession,
    }),
    webCapture,
    webSearch,
  };
}
