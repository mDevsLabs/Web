import type { CopilotKitIntelligence } from '@copilotkit/runtime/v2';
import type { WorkspaceStore } from './workspace.js';

type Selector = NonNullable<
  ConstructorParameters<
    typeof CopilotKitIntelligence
  >[0]['getLearningContainerId']
>;

/** Called before execution, including before a new channel thread reaches WakieAgent. */
export function learningSelector(
  workspace: WorkspaceStore,
  channelWakieId?: string,
): Selector {
  return ({ surface, user, agentId, input }) => {
    if (user?.id !== workspace.ownerId)
      throw new Error('Conversation learning requires the workspace owner.');
    if (surface === 'channel') {
      if (agentId !== channelWakieId)
        throw new Error(
          'Conversation learning requires the configured Slack Wakie.',
        );
      if (
        !workspace
          .conversations()
          .some((thread) => thread.id === input.threadId)
      )
        workspace.bindThread(input.threadId, agentId, 'Slack conversation');
    }
    return (
      workspace.requireThread(input.threadId, agentId).learningContainerId ??
      null
    );
  };
}
