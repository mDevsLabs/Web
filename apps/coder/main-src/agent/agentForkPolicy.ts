/**
 * Background fork policy for omit-`subagent_type` behavior.
 * Pure logic for unit tests and toolExecutor.
 */

export type AgentBackgroundForkInput = {
  /** settings.agent.backgroundForkAgent */
  backgroundForkAgentSetting?: boolean;
  /** (process.env.MAI_CODER_AGENT_BACKGROUND_FORK ?? process.env.ASYNC_AGENT_BACKGROUND_FORK) */
  envAsyncAgentBackgroundFork?: string;
  subagentType?: string;
  runInBackground: boolean;
};

/**
 * When true, the Agent tool should return immediately and run the sub-loop in the background.
 */
export function shouldRunAgentInBackground(
  input: AgentBackgroundForkInput
): boolean {
  if (input.runInBackground) {
    return true;
  }
  const e = input.envAsyncAgentBackgroundFork?.trim().toLowerCase();
  const envOn = e === "1" || e === "true" || e === "yes" || e === "on";
  const gateOn = input.backgroundForkAgentSetting === true || envOn;
  if (!gateOn) {
    return false;
  }
  return !input.subagentType?.trim();
}
