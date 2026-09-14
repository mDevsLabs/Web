import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type AgentBusinessEvent,
  addAgentBusinessEventListener,
  clearAgentBusinessEventListeners,
  emitAgentBusinessEvent,
} from "@/lib/agent/events/business";

function runStartedEvent(runId = "run-1"): AgentBusinessEvent {
  return { chatId: "chat-1", model: "m-1", runId, type: "run_started" };
}

describe("Événements métier Agent", () => {
  afterEach(() => {
    clearAgentBusinessEventListeners();
    vi.restoreAllMocks();
  });

  it("distribue l'événement à tous les consommateurs enregistrés", () => {
    const a = vi.fn();
    const b = vi.fn();
    addAgentBusinessEventListener(a);
    addAgentBusinessEventListener(b);

    emitAgentBusinessEvent(runStartedEvent());

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(a.mock.calls[0][0]).toMatchObject({
      runId: "run-1",
      type: "run_started",
    });
  });

  it("isole un consommateur défaillant sans interrompre les autres", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(() => {
      throw new Error("consumer down");
    });
    const healthy = vi.fn();
    addAgentBusinessEventListener(failing);
    addAgentBusinessEventListener(healthy);

    emitAgentBusinessEvent(runStartedEvent("run-2"));

    expect(failing).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("désabonne proprement via la fonction retournée", () => {
    const listener = vi.fn();
    const unsubscribe = addAgentBusinessEventListener(listener);

    unsubscribe();
    emitAgentBusinessEvent(runStartedEvent("run-3"));

    expect(listener).not.toHaveBeenCalled();
  });
});
