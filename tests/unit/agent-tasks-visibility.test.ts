import { describe, expect, it } from "vitest";
import { reduceAgentDataPart } from "@/components/agent/agent-stream-provider";
import {
  hasTimelineContent,
  visiblePlan,
} from "@/lib/agent/timeline-visibility";
import type { AgentPlan, AgentRunEvent } from "@/lib/agent/types";

// Le plan est généré automatiquement pour toute tâche longue ou à plusieurs
// familles d'outils : son existence ne dit donc RIEN de l'intention de
// l'utilisateur. Seule l'option « Tâches » décide si la liste est visible.

const PLAN = {
  items: [
    { description: null, id: "task-1", label: "Collecter", status: "pending" },
    { description: null, id: "task-2", label: "Rédiger", status: "pending" },
  ],
  title: "Plan de la tâche",
} as unknown as AgentPlan;

const RUN: AgentRunEvent = {
  model: "test/model",
  reasoningLevel: "medium",
  runId: "run-1",
  status: "running",
  tasksEnabled: false,
};

type DataPart = Parameters<typeof reduceAgentDataPart>[1];

const EMPTY_STATE = {
  artifacts: [],
  plan: null,
  run: null,
  sources: [],
  steps: [],
  tasksEnabled: false,
  tools: [],
};

function planPart(plan: AgentPlan): DataPart {
  return { data: plan, type: "data-agent-plan" } as unknown as DataPart;
}

function runPart(tasksEnabled: boolean): DataPart {
  return {
    data: { ...RUN, tasksEnabled },
    type: "data-agent-run",
  } as unknown as DataPart;
}

describe("Liste des tâches — l'option est la seule condition d'affichage", () => {
  it("cache un plan quand l'option n'a pas été activée", () => {
    expect(visiblePlan({ plan: PLAN, tasksEnabled: false })).toBeNull();
  });

  it("montre un plan quand l'option a été activée", () => {
    expect(visiblePlan({ plan: PLAN, tasksEnabled: true })).toBe(PLAN);
  });

  it("reste à null sans plan, même option activée", () => {
    expect(visiblePlan({ plan: null, tasksEnabled: true })).toBeNull();
  });

  it("un plan caché ne suffit pas à faire apparaître la timeline", () => {
    expect(
      hasTimelineContent({
        artifacts: [],
        plan: PLAN,
        run: null,
        sources: [],
        steps: [],
        tasksEnabled: false,
      })
    ).toBe(false);
  });

  it("le même plan, option activée, affiche la timeline", () => {
    expect(
      hasTimelineContent({
        artifacts: [],
        plan: PLAN,
        run: null,
        sources: [],
        steps: [],
        tasksEnabled: true,
      })
    ).toBe(true);
  });

  it("une étape suffit, même sans option et sans plan", () => {
    expect(
      hasTimelineContent({
        artifacts: [],
        plan: null,
        run: null,
        sources: [],
        steps: [{}],
        tasksEnabled: false,
      })
    ).toBe(true);
  });
});

describe("État de flux — le plan n'est absorbé que si l'option est active", () => {
  it("retient tasksEnabled depuis l'événement de run", () => {
    const state = reduceAgentDataPart(EMPTY_STATE, runPart(true));
    expect(state.tasksEnabled).toBe(true);
  });

  it("ignore un data-agent-plan reçu sans option active", () => {
    expect(reduceAgentDataPart(EMPTY_STATE, planPart(PLAN))).toBe(EMPTY_STATE);
  });

  it("absorbe le plan une fois l'option connue de l'état", () => {
    const enabled = reduceAgentDataPart(EMPTY_STATE, runPart(true));
    expect(reduceAgentDataPart(enabled, planPart(PLAN)).plan).toBe(PLAN);
  });
});
