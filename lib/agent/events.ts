import type { UIMessageStreamWriter } from "ai";
import type {
  AgentArtifactRef,
  AgentPlan,
  AgentRunEvent,
  AgentSource,
  AgentStepEvent,
  AgentToolActivity,
} from "@/lib/agent/types";
import type { ChatMessage } from "@/lib/types";

// Diffusion des événements Agent : uniquement des data parts natifs du flux AI
// SDK (agent-run, agent-plan, agent-step, agent-tool, agent-artifact,
// agent-sources), diffusés en transient — la vérité persistée reste en base
// (AgentRun / AgentStep / ToolExecution), ce qui rend la reprise après refresh
// exacte sans dupliquer l'état dans les messages.
export type AgentEventWriter = UIMessageStreamWriter<ChatMessage>;

export function emitAgentRun(
  writer: AgentEventWriter,
  event: AgentRunEvent
): void {
  writer.write({ data: event, transient: true, type: "data-agent-run" });
}

export function emitAgentPlan(writer: AgentEventWriter, plan: AgentPlan): void {
  writer.write({ data: plan, transient: true, type: "data-agent-plan" });
}

export function emitAgentStep(
  writer: AgentEventWriter,
  event: AgentStepEvent
): void {
  writer.write({ data: event, transient: true, type: "data-agent-step" });
}

export function emitAgentTool(
  writer: AgentEventWriter,
  event: AgentToolActivity
): void {
  writer.write({ data: event, transient: true, type: "data-agent-tool" });
}

export function emitAgentArtifact(
  writer: AgentEventWriter,
  artifact: AgentArtifactRef
): void {
  writer.write({
    data: artifact,
    transient: true,
    type: "data-agent-artifact",
  });
}

export function emitAgentSources(
  writer: AgentEventWriter,
  sources: AgentSource[]
): void {
  if (sources.length === 0) {
    return;
  }
  writer.write({ data: sources, transient: true, type: "data-agent-sources" });
}
