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
import type { ChatMessage } from "@/lib/types";

export type ChatToolDeps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
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

export function createChatTools(
  deps: ChatToolDeps,
  mcpTools: Record<string, any>,
  pluginTools: Record<string, any> = {}
) {
  const {
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
    ...pluginTools,
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
