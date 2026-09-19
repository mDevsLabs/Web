import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ApprovalRequestRecord,
  canonicalParamsKey,
} from "@/lib/agent/db-schema";

// Décision d'approbation relue dans les messages entrants. Le client ne peut
// pas élargir un accord : la décision est rattachée à l'appel d'outil exact et
// à la demande persistée du run, et devient caduque si les paramètres présentés
// ont changé. Ces tests verrouillent les refus (double clic, paramètres
// modifiés, demande inconnue) et l'application d'un accord valide.

const getApprovalRequestByToolCall = vi.fn();
const decideApprovalRequest = vi.fn();
const expireApprovalRequestById = vi.fn();
const updateAgentStep = vi.fn();

vi.mock("@/lib/db/agent-foundation-queries", () => ({
  decideApprovalRequest: (...args: unknown[]) => decideApprovalRequest(...args),
  expireApprovalRequestById: (...args: unknown[]) =>
    expireApprovalRequestById(...args),
  getApprovalRequestByToolCall: (...args: unknown[]) =>
    getApprovalRequestByToolCall(...args),
}));

vi.mock("@/lib/db/agent-queries", () => ({
  updateAgentStep: (...args: unknown[]) => updateAgentStep(...args),
}));

const { applyIncomingApprovalDecisions } = await import(
  "@/lib/agent/approvals/incoming"
);

function approvalRow(
  overrides: Partial<ApprovalRequestRecord> = {}
): ApprovalRequestRecord {
  const params = { projectId: "p-1", title: "Rapport Q3" };
  return {
    createdAt: new Date(),
    decidedAt: null,
    denyReason: null,
    expiresAt: new Date(Date.now() + 60_000),
    id: "approval-1",
    params,
    paramsHash: paramsHash(params),
    runId: "run-1",
    status: "pending",
    stepId: "step-1",
    toolCallId: "call-1",
    toolExecutionId: null,
    toolId: "attach_to_project",
    ...overrides,
  } as ApprovalRequestRecord;
}

// Même empreinte canonique que le serveur : les tests ne réimplémentent pas la
// règle, ils utilisent celle du domaine.
function paramsHash(params: unknown): string {
  return createHash("sha256").update(canonicalParamsKey(params)).digest("hex");
}

function messageWithApproval(params: {
  approvalId?: string;
  approved: boolean;
  input?: unknown;
  reason?: string;
  toolCallId?: string;
}) {
  return {
    parts: [
      {
        approval: {
          approved: params.approved,
          id: params.approvalId ?? "approval-1",
          ...(params.reason === undefined ? {} : { reason: params.reason }),
        },
        input: params.input ?? { projectId: "p-1", title: "Rapport Q3" },
        toolCallId: params.toolCallId ?? "call-1",
        type: "tool-attach_to_project",
      },
    ],
    role: "assistant",
  };
}

describe("Application des décisions d'approbation entrantes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApprovalRequestByToolCall.mockResolvedValue(approvalRow());
    decideApprovalRequest.mockResolvedValue({ ok: true, runId: "run-1" });
    updateAgentStep.mockResolvedValue(undefined);
  });

  it("applique un accord dont les paramètres n'ont pas changé", async () => {
    const applied = await applyIncomingApprovalDecisions({
      messages: [messageWithApproval({ approved: true })],
      runId: "run-1",
    });

    expect(decideApprovalRequest).toHaveBeenCalledTimes(1);
    expect(decideApprovalRequest.mock.calls[0][0]).toMatchObject({
      decision: "approve",
      id: "approval-1",
    });
    expect(applied).toMatchObject({ approved: 1, denied: 0, invalidated: 0 });
    expect(updateAgentStep).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        title: "Approbation accordée",
      })
    );
  });

  it("applique un refus en conservant son motif", async () => {
    const applied = await applyIncomingApprovalDecisions({
      messages: [
        messageWithApproval({ approved: false, reason: "Trop risqué" }),
      ],
      runId: "run-1",
    });

    expect(decideApprovalRequest.mock.calls[0][0]).toMatchObject({
      decision: "deny",
      denyReason: "Trop risqué",
    });
    expect(applied).toMatchObject({ denied: 1 });
    expect(updateAgentStep).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", title: "Action refusée" })
    );
  });

  it("invalide un accord si les paramètres présentés ont changé", async () => {
    const applied = await applyIncomingApprovalDecisions({
      messages: [
        messageWithApproval({
          approved: true,
          input: { projectId: "p-2", title: "Autre projet" },
        }),
      ],
      runId: "run-1",
    });

    expect(decideApprovalRequest).not.toHaveBeenCalled();
    expect(expireApprovalRequestById).toHaveBeenCalledWith({
      id: "approval-1",
    });
    expect(applied).toMatchObject({ invalidated: 1 });
  });

  it("ignore un double clic : une seule décision est appliquée", async () => {
    await applyIncomingApprovalDecisions({
      messages: [
        messageWithApproval({ approved: true }),
        messageWithApproval({ approved: true }),
      ],
      runId: "run-1",
    });

    expect(decideApprovalRequest).toHaveBeenCalledTimes(1);
  });

  it("n'applique rien sur une demande déjà décidée (rejeu du flux)", async () => {
    getApprovalRequestByToolCall.mockResolvedValue(
      approvalRow({ status: "approved" })
    );

    const applied = await applyIncomingApprovalDecisions({
      messages: [messageWithApproval({ approved: true })],
      runId: "run-1",
    });

    expect(decideApprovalRequest).not.toHaveBeenCalled();
    expect(applied).toMatchObject({ approved: 0, denied: 0, invalidated: 0 });
  });

  it("n'applique rien pour un appel d'outil inconnu du run", async () => {
    getApprovalRequestByToolCall.mockResolvedValue(null);

    const applied = await applyIncomingApprovalDecisions({
      messages: [messageWithApproval({ approved: true, toolCallId: "autre" })],
      runId: "run-1",
    });

    expect(decideApprovalRequest).not.toHaveBeenCalled();
    expect(applied).toMatchObject({ approved: 0, denied: 0, invalidated: 0 });
  });

  it("tolère une charge utile illisible sans interrompre la reprise", async () => {
    const applied = await applyIncomingApprovalDecisions({
      messages: [
        { parts: ["texte"], role: "assistant" },
        { parts: [{ approval: { id: "x" }, toolCallId: "call-1" }] },
        null,
      ],
      runId: "run-1",
    });

    expect(decideApprovalRequest).not.toHaveBeenCalled();
    expect(applied).toMatchObject({ approved: 0, denied: 0, invalidated: 0 });
  });

  it("ne laisse pas un échec de décision remonter jusqu'à la reprise", async () => {
    decideApprovalRequest.mockRejectedValue(new Error("db down"));

    const applied = await applyIncomingApprovalDecisions({
      messages: [messageWithApproval({ approved: true })],
      runId: "run-1",
    });

    expect(applied).toMatchObject({ approved: 0 });
  });
});
