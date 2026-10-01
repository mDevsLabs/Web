"use client";

import type { DataUIPart } from "ai";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  AgentArtifactRef,
  AgentPlan,
  AgentRunEvent,
  AgentSource,
  AgentStepEvent,
  AgentToolActivity,
} from "@/lib/agent/types";
import type { CustomUIDataTypes } from "@/lib/types";

// État d'exécution affiché : il vient exclusivement des data parts du flux et
// reste volatil. La vérité persistée (AgentRun / AgentStep / ToolExecution) est
// relue depuis l'API après un refresh (voir useAgentRunHistory), ce qui évite
// de dupliquer l'état d'exécution dans les messages.
export type AgentStreamState = {
  artifacts: AgentArtifactRef[];
  plan: AgentPlan | null;
  run: AgentRunEvent | null;
  sources: AgentSource[];
  steps: AgentStepEvent[];
  /**
   * L'utilisateur a activé l'option « Tâches ». Seule condition d'affichage de
   * la liste : un plan existe pour tous les runs, mais il ne doit être visible
   * que si l'option a été demandée — y compris après rechargement, où l'état
   * est reconstruit depuis AgentRun.tasksEnabled.
   */
  tasksEnabled: boolean;
  tools: AgentToolActivity[];
};

export const EMPTY_AGENT_STREAM_STATE: AgentStreamState = {
  artifacts: [],
  plan: null,
  run: null,
  sources: [],
  steps: [],
  tasksEnabled: false,
  tools: [],
};

type AgentStreamContextValue = {
  applyDataPart: (part: DataUIPart<CustomUIDataTypes>) => void;
  reset: (state?: AgentStreamState) => void;
  state: AgentStreamState;
};

const AgentStreamContext = createContext<AgentStreamContextValue | null>(null);

function upsertStep(
  steps: AgentStepEvent[],
  step: AgentStepEvent
): AgentStepEvent[] {
  const index = steps.findIndex((current) => current.stepId === step.stepId);
  if (index === -1) {
    return [...steps, step];
  }
  const next = [...steps];
  next[index] = { ...next[index], ...step };
  return next;
}

function upsertTool(
  tools: AgentToolActivity[],
  tool: AgentToolActivity
): AgentToolActivity[] {
  const index = tools.findIndex(
    (current) =>
      current.stepId === tool.stepId && current.toolId === tool.toolId
  );
  if (index === -1) {
    return [...tools, tool];
  }
  const next = [...tools];
  next[index] = { ...next[index], ...tool };
  return next;
}

function mergeSources(
  current: AgentSource[],
  incoming: AgentSource[]
): AgentSource[] {
  const byId = new Map(current.map((source) => [source.id, source]));
  for (const source of incoming) {
    byId.set(source.id, source);
  }
  return [...byId.values()];
}

export function reduceAgentDataPart(
  state: AgentStreamState,
  part: DataUIPart<CustomUIDataTypes>
): AgentStreamState {
  switch (part.type) {
    case "data-agent-run":
      return {
        ...state,
        run: part.data,
        tasksEnabled: part.data.tasksEnabled === true,
      };
    case "data-agent-plan":
      // Défense en double : le serveur n'émet déjà le plan que si l'option est
      // active, mais un run repris depuis un ancien état ne doit pas non plus
      // faire réapparaître la liste.
      if (!state.tasksEnabled) {
        return state;
      }
      return { ...state, plan: part.data };
    case "data-agent-step":
      return { ...state, steps: upsertStep(state.steps, part.data) };
    case "data-agent-tool":
      return { ...state, tools: upsertTool(state.tools, part.data) };
    case "data-agent-sources":
      return { ...state, sources: mergeSources(state.sources, part.data) };
    case "data-agent-artifact":
      return { ...state, artifacts: [...state.artifacts, part.data] };
    default:
      return state;
  }
}

export function AgentStreamProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AgentStreamState>(
    EMPTY_AGENT_STREAM_STATE
  );

  const applyDataPart = useCallback((part: DataUIPart<CustomUIDataTypes>) => {
    setState((current) => {
      const next = reduceAgentDataPart(current, part);
      return next === current ? current : next;
    });
  }, []);

  const reset = useCallback((next?: AgentStreamState) => {
    setState(next ?? EMPTY_AGENT_STREAM_STATE);
  }, []);

  const value = useMemo<AgentStreamContextValue>(
    () => ({ applyDataPart, reset, state }),
    [applyDataPart, reset, state]
  );

  return (
    <AgentStreamContext.Provider value={value}>
      {children}
    </AgentStreamContext.Provider>
  );
}

export function useAgentStream() {
  const context = useContext(AgentStreamContext);
  if (!context) {
    throw new Error(
      "useAgentStream doit être utilisé dans AgentStreamProvider"
    );
  }
  return context;
}
