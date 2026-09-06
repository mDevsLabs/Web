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
import { getWeather } from "@/lib/ai/tools/get-weather";
import { imageGenerate } from "@/lib/ai/tools/image-generate";
import { memory } from "@/lib/ai/tools/memory";
import { note } from "@/lib/ai/tools/note";
import { qrCodeGenerator } from "@/lib/ai/tools/qr-code-generator";
import { quizzly } from "@/lib/ai/tools/quizzly";
import { readUrl } from "@/lib/ai/tools/read-url";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { webCapture } from "@/lib/ai/tools/web-capture";
import { webSearch } from "@/lib/ai/tools/web-search";
import type { ChatMessage } from "@/lib/types";

export type ChatToolDeps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
  sessionToken: string;
  userId: string;
  userEmail: string;
  isGhostMode: boolean;
  chatModel: string;
  memoryActive: boolean;
  memoryAllowAdd: boolean;
  memoryLimit: number;
  effectiveAgentId: string | null;
};

export function createChatTools(
  deps: ChatToolDeps,
  mcpTools: Record<string, any>
) {
  const {
    dataStream,
    sessionToken,
    userId,
    userEmail,
    isGhostMode,
    chatModel,
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

  return {
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
    getWeather,
    ...(isGhostMode
      ? {}
      : {
          imageGenerate: imageGenerate({
            dataStream,
            session: userSessionWithToken,
          }),
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
    quizzly,
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
    ...mcpTools,
  };
}
