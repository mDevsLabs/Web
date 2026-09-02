import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/chat/artifact";
import type { askUser } from "./ai/tools/ask-user";
import type { audioGenerate } from "./ai/tools/audio-generate";
import type { calculator } from "./ai/tools/calculator";
import type { codeExecution } from "./ai/tools/code-execution";
import type { createDocument } from "./ai/tools/create-document";
import type { currencyConverter } from "./ai/tools/currency-converter";
import type { dateTime } from "./ai/tools/datetime";
import type { editDocument } from "./ai/tools/edit-document";
import type { generateChart } from "./ai/tools/generate-chart";
import type { getWeather } from "./ai/tools/get-weather";
import type { imageGenerate } from "./ai/tools/image-generate";
import type { memory } from "./ai/tools/memory";
import type { note } from "./ai/tools/note";
import type { qrCodeGenerator } from "./ai/tools/qr-code-generator";
import type { quizzly } from "./ai/tools/quizzly";
import type { readUrl } from "./ai/tools/read-url";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { webSearch } from "./ai/tools/web-search";
import type { Suggestion } from "./db/schema";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type editDocumentTool = InferUITool<ReturnType<typeof editDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type imageGenerateTool = InferUITool<ReturnType<typeof imageGenerate>>;
type audioGenerateTool = InferUITool<ReturnType<typeof audioGenerate>>;
type codeExecutionTool = InferUITool<typeof codeExecution>;
type calculatorTool = InferUITool<typeof calculator>;
type dateTimeTool = InferUITool<typeof dateTime>;
type noteTool = InferUITool<ReturnType<typeof note>>;
type memoryTool = InferUITool<ReturnType<typeof memory>>;
type webSearchTool = InferUITool<typeof webSearch>;
type readUrlTool = InferUITool<typeof readUrl>;
type generateChartTool = InferUITool<typeof generateChart>;
type currencyConverterTool = InferUITool<typeof currencyConverter>;
type qrCodeGeneratorTool = InferUITool<typeof qrCodeGenerator>;
type askUserTool = InferUITool<typeof askUser>;
type quizzlyTool = InferUITool<typeof quizzly>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  editDocument: editDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  imageGenerate: imageGenerateTool;
  audioGenerate: audioGenerateTool;
  codeExecution: codeExecutionTool;
  calculator: calculatorTool;
  dateTime: dateTimeTool;
  note: noteTool;
  memory: memoryTool;
  webSearch: webSearchTool;
  readUrl: readUrlTool;
  generateChart: generateChartTool;
  currencyConverter: currencyConverterTool;
  qrCodeGenerator: qrCodeGeneratorTool;
  askUser: askUserTool;
  quizzly: quizzlyTool;
};

export type WaitingStatusData = {
  phase: "waiting" | "still-waiting" | "health" | "thinking";
  message: string;
  modelId: string;
  modelName: string;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  audioDelta: string;
  sheetDelta: string;
  codeDelta: string;
  htmlDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  "chat-title": string;
  "waiting-status": WaitingStatusData;
  usage: { tokens: number; total: number };
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
