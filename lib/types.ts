import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/chat/artifact";
import type {
  AgentArtifactRef,
  AgentPlan,
  AgentRunEvent,
  AgentSource,
  AgentStepEvent,
  AgentToolActivity,
} from "./agent/types";
import type { askUser } from "./ai/tools/ask-user";
import type { audioGenerate } from "./ai/tools/audio-generate";
import type { audioPodcast } from "./ai/tools/audio-podcast";
import type { calculator } from "./ai/tools/calculator";
import type { calendarReminder } from "./ai/tools/calendar-reminder";
import type { codeExecution } from "./ai/tools/code-execution";
import type { createDocument } from "./ai/tools/create-document";
import type { cryptoTools } from "./ai/tools/crypto-tools";
import type { currencyConverter } from "./ai/tools/currency-converter";
import type { dateTime } from "./ai/tools/datetime";
import type { documentParser } from "./ai/tools/document-parser";
import type { editDocument } from "./ai/tools/edit-document";
import type { generateChart } from "./ai/tools/generate-chart";
import type { generateDiagram } from "./ai/tools/generate-diagram";
import type { getAccountUsage } from "./ai/tools/get-account-usage";
import type { getWeather } from "./ai/tools/get-weather";
import type { imageGenerate } from "./ai/tools/image-generate";
import type { memory } from "./ai/tools/memory";
import type { note } from "./ai/tools/note";
import type { qrCodeGenerator } from "./ai/tools/qr-code-generator";
import type { quizzly } from "./ai/tools/quizzly";
import type { readUrl } from "./ai/tools/read-url";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateAccountProfile } from "./ai/tools/update-account-profile";
import type { updateDocument } from "./ai/tools/update-document";
import type { updateProfilePicture } from "./ai/tools/update-profile-picture";
import type { webCapture } from "./ai/tools/web-capture";
import type { webSearch } from "./ai/tools/web-search";
import type { DocumentPatchOp } from "./artifacts/patch";
import type { Suggestion } from "./db/schema";

/**
 * Payload diffusé dans le flux AI SDK quand l'IA propose un patch ciblé.
 * `oldContent`/`newContent` permettent l'aperçu diff côté client ; l'application
 * réelle passe toujours par la route d'acceptation (revalidation serveur).
 */
export type DocumentProposalPayload = {
  baseContent: string;
  baseHash: string;
  chatId: string | null;
  description: string | null;
  documentId: string;
  id: string;
  ops: DocumentPatchOp[];
  /** Contenu résultant si le patch est appliqué tel quel (aperçu). */
  proposedContent: string;
};

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
type audioPodcastTool = InferUITool<ReturnType<typeof audioPodcast>>;
type codeExecutionTool = InferUITool<typeof codeExecution>;
type calculatorTool = InferUITool<typeof calculator>;
type dateTimeTool = InferUITool<typeof dateTime>;
type noteTool = InferUITool<ReturnType<typeof note>>;
type memoryTool = InferUITool<ReturnType<typeof memory>>;
type webSearchTool = InferUITool<typeof webSearch>;
type webCaptureTool = InferUITool<typeof webCapture>;
type readUrlTool = InferUITool<typeof readUrl>;
type documentParserTool = InferUITool<typeof documentParser>;
type generateChartTool = InferUITool<typeof generateChart>;
type generateDiagramTool = InferUITool<typeof generateDiagram>;
type calendarReminderTool = InferUITool<typeof calendarReminder>;
type cryptoToolsTool = InferUITool<typeof cryptoTools>;
type currencyConverterTool = InferUITool<typeof currencyConverter>;
type qrCodeGeneratorTool = InferUITool<typeof qrCodeGenerator>;
type askUserTool = InferUITool<typeof askUser>;
type quizzlyTool = InferUITool<typeof quizzly>;
type updateAccountProfileTool = InferUITool<
  ReturnType<typeof updateAccountProfile>
>;
type updateProfilePictureTool = InferUITool<
  ReturnType<typeof updateProfilePicture>
>;
type getAccountUsageTool = InferUITool<ReturnType<typeof getAccountUsage>>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  editDocument: editDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  imageGenerate: imageGenerateTool;
  audioGenerate: audioGenerateTool;
  audioPodcast: audioPodcastTool;
  codeExecution: codeExecutionTool;
  calculator: calculatorTool;
  dateTime: dateTimeTool;
  note: noteTool;
  memory: memoryTool;
  webSearch: webSearchTool;
  webCapture: webCaptureTool;
  readUrl: readUrlTool;
  documentParser: documentParserTool;
  generateChart: generateChartTool;
  generateDiagram: generateDiagramTool;
  calendarReminder: calendarReminderTool;
  cryptoTools: cryptoToolsTool;
  currencyConverter: currencyConverterTool;
  qrCodeGenerator: qrCodeGeneratorTool;
  askUser: askUserTool;
  quizzly: quizzlyTool;
  updateAccountProfile: updateAccountProfileTool;
  updateProfilePicture: updateProfilePictureTool;
  getAccountUsage: getAccountUsageTool;
};

export type WaitingStatusData = {
  phase: "waiting" | "still-waiting" | "health" | "thinking";
  message: string;
  modelId: string;
  modelName: string;
};

// Événements Agent diffusés dans le flux AI SDK existant (data parts natifs) :
// mêmes garanties de reprise que le Chat, aucun protocole parallèle.
export type CustomUIDataTypes = {
  "agent-artifact": AgentArtifactRef;
  "agent-plan": AgentPlan;
  "agent-run": AgentRunEvent;
  "agent-sources": AgentSource[];
  "agent-step": AgentStepEvent;
  "agent-tool": AgentToolActivity;
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
  // Proposition de modification ciblée d'un Artifact (patch IA à approuver).
  proposal: DocumentProposalPayload;
  "chat-title": string;
  "waiting-status": WaitingStatusData;
  usage: { tokens: number; total: number };
  podcastProgress: { completed: number; id: string; total: number };
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  contentType: string;
  name: string;
  /** Taille connue du fichier, utilisée pour appliquer les limites côté client. */
  size?: number;
  url: string;
};
