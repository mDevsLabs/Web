import type {
  ComponentProps,
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import type { MistakeLimitPayload } from "../AgentMistakeLimitDialog";
import type { PlanReviewPanel } from "../PlanReviewPanel";
import type { ToolApprovalPayload } from "../ToolApprovalCard";
import type { TurnFocusRow } from "../agentTurnFocus";
import type { ChatComposer } from "../ChatComposer";
import type { ComposerSegment } from "../composerSegments";
import type { AgentSessionState } from "../hooks/useAgentSession";
import type { TeamSessionState } from "../hooks/useTeamSession";
import type { WizardPending } from "../hooks/useWizardPending";
import type { TFunction } from "../i18n";
import type { AgentPendingPatch, TurnTokenUsage } from "../ipcTypes";
import type { UserMessagePart } from "../messageParts";
import type { ParsedPlan, PlanQuestion } from "../planParser";
import type { ChatMessage } from "../threadTypes";
import type { AgentUserInputRequest } from "../agentSessionTypes";

export type SharedComposerProps = Omit<
  ComponentProps<typeof ChatComposer>,
  | "slot"
  | "variant"
  | "segments"
  | "setSegments"
  | "canSend"
  | "extraClass"
  | "showGitBranchRow"
>;

export type AgentChatPanelProps = {
  layout?: "agent-center" | "editor-rail";
  t: TFunction;
  hasConversation: boolean;
  /** 持久化的历史消息；live 助手气泡由面板内部通过 streamingStore 订阅合成，不从这里传入 */
  persistedMessages: ChatMessage[];
  messagesThreadId: string | null;
  currentId: string | null;
  messagesViewportRef: RefObject<HTMLDivElement | null>;
  messagesTrackRef: RefObject<HTMLDivElement | null>;
  inlineResendRootRef: RefObject<HTMLDivElement | null>;
  onMessagesScroll: () => void;
  awaitingReply: boolean;
  streamStartedAtRef: RefObject<number | null>;
  firstTokenAtRef: RefObject<number | null>;
  thoughtSecondsByThread: Record<string, number>;
  lastTurnUsage: TurnTokenUsage | null;
  composerMode: ComponentProps<typeof ChatComposer>["composerMode"];
  workspace: string | null;
  workspaceBasename: string;
  knownSlashCommands: string[];
  revertedFiles: ReadonlySet<string>;
  revertedChangeKeys: ReadonlySet<string>;
  resendFromUserIndex: number | null;
  inlineResendSegments: ComposerSegment[];
  setInlineResendSegments: Dispatch<SetStateAction<ComposerSegment[]>>;
  composerSegments: ComposerSegment[];
  setComposerSegments: Dispatch<SetStateAction<ComposerSegment[]>>;
  canSendComposer: boolean;
  canSendInlineResend: boolean;
  sharedComposerProps: SharedComposerProps;
  onStartInlineResend: (
    userMessageIndex: number,
    content: string,
    parts?: UserMessagePart[]
  ) => void;
  onOpenWorkspaceFile: (rel: string) => void;
  onOpenAgentConversationFile: (
    rel: string,
    line?: number,
    end?: number,
    options?: { diff?: string | null; allowReviewActions?: boolean }
  ) => void;
  onRunCommand: (cmd: string) => void;
  pendingAgentPatches: AgentPendingPatch[];
  agentReviewBusy: boolean;
  onApplyAgentPatchOne: (id: string) => void;
  onApplyAgentPatchesAll: () => void;
  onDiscardAgentReview: () => void;
  planQuestion: PlanQuestion | null;
  onPlanQuestionSubmit: (answer: string) => void;
  onPlanQuestionSkip: () => void;
  userInputRequest: AgentUserInputRequest | null;
  onUserInputSubmit: (answers: Record<string, string>) => Promise<void>;
  wizardPending: WizardPending | null;
  setWizardPending: Dispatch<SetStateAction<WizardPending | null>>;
  executeSkillCreatorSend: (
    scope: "user" | "project",
    pending: WizardPending
  ) => void;
  executeRuleWizardSend: (
    ruleScope: "always" | "glob" | "manual",
    globPattern: string | undefined,
    pending: WizardPending
  ) => void;
  executeSubagentWizardSend: (
    scope: "user" | "project",
    pending: WizardPending
  ) => void;
  mistakeLimitRequest: MistakeLimitPayload | null;
  respondMistakeLimit: (
    action: "continue" | "stop" | "hint",
    hint?: string
  ) => void;
  agentPlanEffectivePlan: ParsedPlan | null;
  editorPlanReviewDismissed: boolean;
  planFileRelPath: string | null;
  planFilePath: string | null;
  defaultModel: string;
  modelPickerItems: ComponentProps<typeof PlanReviewPanel>["modelItems"];
  planReviewIsBuilt: boolean;
  onPlanBuild: (modelId: string) => void;
  onPlanReviewClose: () => void;
  onPlanTodoToggle: (id: string) => void;
  toolApprovalRequest: ToolApprovalPayload | null;
  respondToolApproval: (allow: boolean) => void;
  /** 逐文件忽略改动条；与 Git 合并后的列表在面板内计算，避免 Git fullStatus 拖垮 useAgentChatPanelProps */
  dismissedFiles: ReadonlySet<string>;
  snapshotPaths: ReadonlySet<string>;
  /** main 进程仍持有快照、可以真撤销的相对路径集合；用于按钮置灰。 */
  revertableSnapshotPaths: ReadonlySet<string>;
  /** 撤销因为没有快照而失败时的提示文案；非空时面板顶部展示一行警告条。 */
  revertNotice: string | null;
  onDismissRevertNotice: () => void;
  fileChangesDismissed: boolean;
  onKeepAllEdits: () => void;
  onRevertAllEdits: () => void;
  onKeepFileEdit: (rel: string) => void;
  onRevertFileEdit: (rel: string) => void;
  showScrollToBottomButton: boolean;
  scrollMessagesToBottom: (
    behavior?: ScrollBehavior,
    options?: { protectActivePreflight?: boolean }
  ) => void;
  scheduleMessagesScrollToBottom: () => void;
  agentPlanSummaryCard: ReactNode;
  teamSession: TeamSessionState | null;
  onSelectTeamExpert: (taskId: string) => void;
  agentSession: AgentSessionState | null;
  onSelectAgentSession: (agentId: string | null) => void;
  onTeamPlanApprove: (proposalId: string, feedback?: string) => void;
  onTeamPlanReject: (proposalId: string, feedback?: string) => void;
  onChatPanelDropFiles: (files: File[]) => Promise<void>;
};

export type ChatRenderRow = TurnFocusRow & {
  key: string;
  className: string;
  content: ReactNode;
  dataMsgIndex?: number;
  dataPreflightFor?: number;
  dataContentBottom?: boolean;
};
