import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { memo } from "react";
import {
  AgentMistakeLimitDialog,
  type MistakeLimitPayload,
} from "../AgentMistakeLimitDialog";
import { AgentReviewPanel } from "../AgentReviewPanel";
import type { AgentUserInputRequest } from "../agentSessionTypes";
import type { ChatComposer } from "../ChatComposer";
import type { WizardPending } from "../hooks/useWizardPending";
import type { TFunction } from "../i18n";
import type { AgentPendingPatch } from "../ipcTypes";
import { PlanQuestionDialog } from "../PlanQuestionDialog";
import { PlanReviewPanel } from "../PlanReviewPanel";
import type { ParsedPlan, PlanQuestion } from "../planParser";
import { RuleWizardDialog } from "../RuleWizardDialog";
import { SkillScopeDialog } from "../SkillScopeDialog";
import { SubagentScopeDialog } from "../SubagentScopeDialog";
import { UserInputRequestDialog } from "../UserInputRequestDialog";

export type AgentChatOverlaysProps = {
  hasConversation: boolean;
  isEditorRail: boolean;
  composerMode: ComponentProps<typeof ChatComposer>["composerMode"];
  workspace: string | null;
  awaitingReply: boolean;
  pendingAgentPatches: AgentPendingPatch[];
  agentReviewBusy: boolean;
  onApplyAgentPatchesAll: () => void;
  onApplyAgentPatchOne: (id: string) => void;
  onDiscardAgentReview: () => void;
  onOpenAgentConversationFile: (
    rel: string,
    line?: number,
    end?: number,
    options?: { diff?: string | null; allowReviewActions?: boolean }
  ) => void;
  planQuestion: PlanQuestion | null;
  onPlanQuestionSkip: () => void;
  onPlanQuestionSubmit: (answer: string) => void;
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
  defaultModel: string;
  modelPickerItems: ComponentProps<typeof PlanReviewPanel>["modelItems"];
  onPlanBuild: (modelId: string) => void;
  onPlanReviewClose: () => void;
  onPlanTodoToggle: (id: string) => void;
  planReviewIsBuilt: boolean;
  planFileRelPath: string | null;
  planFilePath: string | null;
  t: TFunction;
};

export const AgentChatOverlays = memo(function AgentChatOverlays({
  hasConversation,
  isEditorRail,
  composerMode,
  workspace,
  awaitingReply,
  pendingAgentPatches,
  agentReviewBusy,
  onApplyAgentPatchesAll,
  onApplyAgentPatchOne,
  onDiscardAgentReview,
  onOpenAgentConversationFile,
  planQuestion,
  onPlanQuestionSkip,
  onPlanQuestionSubmit,
  userInputRequest,
  onUserInputSubmit,
  wizardPending,
  setWizardPending,
  executeSkillCreatorSend,
  executeRuleWizardSend,
  executeSubagentWizardSend,
  mistakeLimitRequest,
  respondMistakeLimit,
  agentPlanEffectivePlan,
  editorPlanReviewDismissed,
  defaultModel,
  modelPickerItems,
  onPlanBuild,
  onPlanReviewClose,
  onPlanTodoToggle,
  planReviewIsBuilt,
  planFileRelPath,
  planFilePath,
  t,
}: AgentChatOverlaysProps) {
  return (
    <>
      {hasConversation && pendingAgentPatches.length > 0 ? (
        <AgentReviewPanel
          busy={agentReviewBusy}
          onApplyAll={onApplyAgentPatchesAll}
          onApplyOne={onApplyAgentPatchOne}
          onDiscard={onDiscardAgentReview}
          onOpenFile={(rel, line, end, options) =>
            onOpenAgentConversationFile(rel, line, end, {
              ...options,
              allowReviewActions: true,
            })
          }
          patches={pendingAgentPatches}
          workspaceRoot={workspace}
        />
      ) : null}

      {hasConversation &&
      planQuestion &&
      (composerMode === "plan" || composerMode === "team") ? (
        <PlanQuestionDialog
          onSkip={onPlanQuestionSkip}
          onSubmit={onPlanQuestionSubmit}
          question={planQuestion}
        />
      ) : null}
      {hasConversation && userInputRequest ? (
        <UserInputRequestDialog
          onSubmit={onUserInputSubmit}
          request={userInputRequest}
        />
      ) : null}

      {wizardPending?.kind === "create-skill" ? (
        <SkillScopeDialog
          onCancel={() => setWizardPending(null)}
          onConfirm={(scope) => {
            const p = wizardPending;
            setWizardPending(null);
            if (p?.kind === "create-skill") {
              void executeSkillCreatorSend(scope, p);
            }
          }}
          workspaceOpen={Boolean(workspace)}
        />
      ) : null}
      {wizardPending?.kind === "create-rule" ? (
        <RuleWizardDialog
          onCancel={() => setWizardPending(null)}
          onConfirm={(ruleScope, globPattern) => {
            const p = wizardPending;
            setWizardPending(null);
            if (p?.kind === "create-rule") {
              void executeRuleWizardSend(ruleScope, globPattern, p);
            }
          }}
        />
      ) : null}
      {wizardPending?.kind === "create-subagent" ? (
        <SubagentScopeDialog
          onCancel={() => setWizardPending(null)}
          onConfirm={(scope) => {
            const p = wizardPending;
            setWizardPending(null);
            if (p?.kind === "create-subagent") {
              void executeSubagentWizardSend(scope, p);
            }
          }}
          workspaceOpen={Boolean(workspace)}
        />
      ) : null}

      <AgentMistakeLimitDialog
        body={
          mistakeLimitRequest
            ? t("agent.mistakeLimit.body", {
                count: mistakeLimitRequest.consecutiveFailures,
                threshold: mistakeLimitRequest.threshold,
              })
            : ""
        }
        continueLabel={t("agent.mistakeLimit.continue")}
        hintFieldLabel={t("agent.mistakeLimit.hintField")}
        hintPlaceholder={t("agent.mistakeLimit.hintPlaceholder")}
        onContinue={() => void respondMistakeLimit("continue")}
        onSendHint={(hint) => void respondMistakeLimit("hint", hint)}
        onStop={() => void respondMistakeLimit("stop")}
        open={mistakeLimitRequest !== null}
        payload={mistakeLimitRequest}
        sendHintLabel={t("agent.mistakeLimit.sendHint")}
        stopLabel={t("agent.mistakeLimit.stop")}
        title={t("agent.mistakeLimit.title")}
      />

      {isEditorRail &&
      hasConversation &&
      agentPlanEffectivePlan &&
      composerMode === "plan" &&
      !editorPlanReviewDismissed ? (
        <PlanReviewPanel
          buildDisabled={awaitingReply}
          initialBuildModelId={defaultModel}
          modelItems={modelPickerItems}
          onBuild={onPlanBuild}
          onClose={onPlanReviewClose}
          onTodoToggle={onPlanTodoToggle}
          plan={agentPlanEffectivePlan}
          planBuilt={planReviewIsBuilt}
          planFileDisplayPath={planFileRelPath ?? planFilePath}
        />
      ) : null}
    </>
  );
});
