import { describe, expect, it } from "vitest";
import type { AgentBusinessEvent } from "@/lib/agent/events/business";
import {
  NOTIFIABLE_EVENT_TYPES,
  notificationForEvent,
} from "@/lib/agent/notifications/service";

describe("NotificationService Agent", () => {
  it("ne notifie pas un court run réussi", () => {
    const event: AgentBusinessEvent = {
      chatId: "chat-1",
      runId: "run-1",
      status: "completed",
      type: "run_finished",
    };
    const notification = notificationForEvent(event, {
      durationMs: 5000,
      isScheduledResult: false,
    });
    expect(notification).toBeNull();
  });

  it("notifie un run long réussi", () => {
    const event: AgentBusinessEvent = {
      chatId: "chat-1",
      runId: "run-1b",
      status: "completed",
      type: "run_finished",
    };
    const notification = notificationForEvent(event, {
      durationMs: 5 * 60_000,
      isScheduledResult: false,
    });
    expect(notification?.title).toBe("Agent a terminé");
    expect(notification?.link).toBe("/agent/runs/run-1b");
  });

  it("qualifie le résultat d'une tâche planifiée", () => {
    const event: AgentBusinessEvent = {
      chatId: "chat-1",
      runId: "run-2",
      status: "completed",
      type: "run_finished",
    };
    const notification = notificationForEvent(event, {
      durationMs: 1000,
      isScheduledResult: true,
    });
    expect(notification?.title.startsWith("Tâche planifiée")).toBe(true);
    expect(notification?.type).toBe("agent_run_finished");
  });

  it("cible l'approbation avec un lien dédié", () => {
    const event: AgentBusinessEvent = {
      approvalRequestId: "appr-9",
      runId: "run-3",
      toolId: "send_email",
      type: "approval_required",
    };
    const notification = notificationForEvent(event, {
      isScheduledResult: false,
    });
    expect(notification?.type).toBe("agent_approval_required");
    expect(notification?.link).toBe("/agent/runs/run-3?approval=appr-9");
  });

  it("ignore les statuts non notifiables (cancelled)", () => {
    const event: AgentBusinessEvent = {
      chatId: "chat-1",
      runId: "run-4",
      status: "cancelled",
      type: "run_finished",
    };
    expect(
      notificationForEvent(event, { isScheduledResult: false })
    ).toBeNull();
  });

  it("qualifie explicitement un run interrompu par la limite de durée", () => {
    const event: AgentBusinessEvent = {
      chatId: "chat-1",
      runId: "run-5",
      status: "timed_out",
      type: "run_finished",
    };
    const notification = notificationForEvent(event, {
      isScheduledResult: false,
    });
    expect(notification?.title).toBe("Limite de durée atteinte");
  });

  it("couvre les événements importants définis par le cahier des charges", () => {
    expect(NOTIFIABLE_EVENT_TYPES).toEqual([
      "approval_required",
      "run_finished",
      "waiting_for_user",
    ]);
  });
});
