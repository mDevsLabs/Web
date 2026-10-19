import type { Dispatch, RefObject, SetStateAction } from "react";
import { memo } from "react";
import { ChatComposer } from "../ChatComposer";
import type { ComposerSegment } from "../composerSegments";
import type { TFunction } from "../i18n";
import type { UserMessagePart } from "../messageParts";
import { UserMessageRich } from "../UserMessageRich";
import type { SharedComposerProps } from "./types";

export type AgentUserMessageRowProps = {
  isEditingThisUser: boolean;
  inlineResendRootRef: RefObject<HTMLDivElement | null>;
  sharedComposerProps: SharedComposerProps;
  canSendInlineResend: boolean;
  inlineResendSegments: ComposerSegment[];
  setInlineResendSegments: Dispatch<SetStateAction<ComposerSegment[]>>;
  userSegments: ComposerSegment[];
  awaitingReply: boolean;
  userMessageIndex: number;
  content: string;
  parts?: UserMessagePart[];
  onStartInlineResend: (
    userMessageIndex: number,
    content: string,
    parts?: UserMessagePart[]
  ) => void;
  onOpenWorkspaceFile: (rel: string) => void;
  t: TFunction;
};

export const AgentUserMessageRow = memo(function AgentUserMessageRow({
  isEditingThisUser,
  inlineResendRootRef,
  sharedComposerProps,
  canSendInlineResend,
  inlineResendSegments,
  setInlineResendSegments,
  userSegments,
  awaitingReply,
  userMessageIndex,
  content,
  parts,
  onStartInlineResend,
  onOpenWorkspaceFile,
  t,
}: AgentUserMessageRowProps) {
  if (isEditingThisUser) {
    return (
      <div
        className="ref-msg-slot ref-msg-slot--composer"
        ref={inlineResendRootRef}
      >
        <ChatComposer
          {...sharedComposerProps}
          canSend={canSendInlineResend}
          extraClass="ref-capsule--inline-edit"
          segments={inlineResendSegments}
          setSegments={setInlineResendSegments}
          showGitBranchRow={false}
          slot="inline"
        />
      </div>
    );
  }

  return (
    <div className="ref-msg-slot ref-msg-slot--user">
      <button
        className="ref-msg-user"
        disabled={awaitingReply}
        onClick={() => {
          if (awaitingReply) {
            return;
          }
          onStartInlineResend(userMessageIndex, content, parts);
        }}
        title={
          awaitingReply
            ? t("app.userMsgGenerating")
            : t("app.userMsgEditHint")
        }
        type="button"
      >
        <UserMessageRich
          onFileClick={onOpenWorkspaceFile}
          segments={userSegments}
        />
      </button>
    </div>
  );
});
