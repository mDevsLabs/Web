import { chatOwnerMatches } from "@/lib/agent/channel";
import { getAgentFlags } from "@/lib/agent/flags";
import { paramsHashOf } from "@/lib/agent/params-hash";
import { getAgentToolLabel } from "@/lib/agent/tools/catalog";
import { errorResponse } from "@/lib/api/error-response";
import { getMaiUser } from "@/lib/auth/session";
import { getPendingApprovalForRun } from "@/lib/db/agent-foundation-queries";
import {
  getActiveAgentRunByChatId,
  getAgentActivityRuns,
  getAgentRunsByChatId,
  getAgentStepsByRunId,
  getToolExecutionsByRunId,
} from "@/lib/db/agent-queries";
import { getChatById, getDocumentById } from "@/lib/db/queries";
import { getProjectAccess } from "@/lib/projects/access";

function sanitizeToolOutput(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[TRUNCATED]";
  if (typeof value === "string") return value.slice(0, 10_000);
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeToolOutput(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([key, item]) => [
          key,
          /secret|token|password|authorization|api.?key/i.test(key)
            ? "[REDACTED]"
            : sanitizeToolOutput(item, depth + 1),
        ])
    );
  }
  return value;
}

// Restauration après refresh : le serveur est la source de vérité du run. Le
// frontend récupère runs, steps et exécutions d'outils, et n'a jamais besoin de
// rejouer le flux pour retrouver l'état de l'exécution.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (searchParams.get("view") === "activity") {
    const user = await getMaiUser();
    if (!user) return errorResponse("auth_required");
    if (!getAgentFlags()["agent.activity"])
      return errorResponse("service_unavailable");
    const parsedDays = Number(searchParams.get("days") ?? 30);
    const days = [7, 30, 90].includes(parsedDays) ? parsedDays : 30;
    const runs = await getAgentActivityRuns({
      since: new Date(Date.now() - days * 86_400_000),
      userId: user.id || user.email,
    });
    const useful = runs.filter((run) => run.useful !== null);
    const goal = runs.filter((run) => run.goalReached !== null);
    const activeDuration = (run: (typeof runs)[number]) =>
      run.checkpoint?.duration?.activeMs ??
      (run.usage as { durationMs?: number })?.durationMs ??
      0;
    return Response.json(
      {
        days,
        runs: runs.slice(0, 100).map((run) => ({
          chatId: run.chatId,
          completedAt: run.completedAt,
          createdAt: run.createdAt,
          goalReached: run.goalReached,
          id: run.id,
          model: run.model,
          parentRunId: run.parentRunId,
          status: run.status,
          usage: { ...run.usage, durationMs: activeDuration(run) },
          useful: run.useful,
        })),
        totals: {
          activeMs: runs.reduce((sum, run) => sum + activeDuration(run), 0),
          byStatus: Object.fromEntries(
            [
              "queued",
              "running",
              "waiting_for_tool",
              "waiting_for_approval",
              "waiting_for_user",
              "completed",
              "failed",
              "cancelled",
              "timed_out",
            ].map((status) => [
              status,
              runs.filter((run) => run.status === status).length,
            ])
          ),
          cost: null,
          goalReached: {
            count: goal.length,
            positive: goal.filter((run) => run.goalReached).length,
          },
          resumed: runs.filter((run) => run.parentRunId !== null).length,
          runs: runs.length,
          tokens: runs.reduce(
            (sum, run) =>
              sum +
              Number((run.usage as { totalTokens?: number })?.totalTokens ?? 0),
            0
          ),
          useful: {
            count: useful.length,
            positive: useful.filter((run) => run.useful).length,
          },
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  if (!chatId) {
    return errorResponse("invalid_request", {
      message: "Le paramètre 'chatId' est obligatoire.",
    });
  }

  const user = await getMaiUser();
  if (!user) {
    return errorResponse("auth_required");
  }
  const userId = user.id || user.email;

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return errorResponse("not_found", {
      message: "La conversation demandée est introuvable.",
    });
  }
  if (
    !chatOwnerMatches({
      chatUserId: chat.userId,
      email: user.email,
      userId,
      username: user.username,
    })
  ) {
    return errorResponse("access_denied");
  }

  if (searchParams.get("view") === "approvalPreview") {
    if (!getAgentFlags()["agent.approvalPreview"])
      return Response.json({ enabled: false });
    const toolCallId = searchParams.get("toolCallId");
    if (!toolCallId) return errorResponse("invalid_request");
    const activeRun = await getActiveAgentRunByChatId({ chatId });
    const pending = activeRun
      ? await getPendingApprovalForRun({ runId: activeRun.id })
      : null;
    if (
      !pending ||
      pending.toolCallId !== toolCallId ||
      paramsHashOf(pending.params) !== pending.paramsHash
    ) {
      return errorResponse("not_found");
    }
    const input = pending.params;
    let target =
      ["projectId", "documentId", "artifactId", "url", "id"]
        .map((key) => input[key])
        .find((value): value is string => typeof value === "string")
        ?.slice(0, 180) ?? "ressource indiquée dans la demande";
    const action =
      typeof input.action === "string" ? input.action.slice(0, 60) : "exécuter";
    let effect = `${action} via ${getAgentToolLabel(pending.toolId)}`;
    if (
      pending.toolId === "attach_to_project" &&
      typeof input.projectId === "string" &&
      typeof input.documentId === "string"
    ) {
      const [document, project] = await Promise.all([
        getDocumentById({ id: input.documentId }).catch(() => null),
        getProjectAccess({
          projectId: input.projectId,
          userEmail: user.email,
          userId,
        }).catch(() => null),
      ]);
      if (document?.userId === userId && project) {
        target = project.project.name.slice(0, 100);
        effect = `Ajouter « ${(document.title ?? "livrable").slice(0, 100)} » au projet « ${target} »`;
      }
    } else if (pending.toolId === "manage_memory") {
      target =
        action === "add" && typeof input.content === "string"
          ? input.content.slice(0, 160)
          : target;
      effect =
        action === "delete"
          ? "Supprimer la mémoire indiquée"
          : action === "add"
            ? "Enregistrer cette mémoire"
            : `${action} dans les mémoires`;
    }
    const details = Object.entries(input)
      .filter(
        ([key, value]) =>
          !/secret|token|password|auth|api.?key/i.test(key) &&
          (typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean")
      )
      .slice(0, 6)
      .map(([key, value]) => `${key}: ${String(value).slice(0, 120)}`);
    return Response.json(
      {
        enabled: true,
        preview: {
          details,
          effect,
          expiresAt: pending.expiresAt,
          paramsHash: pending.paramsHash,
          target,
          tool: getAgentToolLabel(pending.toolId),
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const runs = await getAgentRunsByChatId({ chatId });
  const [steps, executions] = await Promise.all([
    Promise.all(runs.map((run) => getAgentStepsByRunId({ runId: run.id }))),
    Promise.all(runs.map((run) => getToolExecutionsByRunId({ runId: run.id }))),
  ]);

  // Actions suggérées validées côté serveur, persistées en fin de run : le
  // client les affiche telles quelles et n'exécute que via la route dédiée.
  const runActions = Object.fromEntries(
    runs.map((run) => [
      run.id,
      (run.suggestedActions ?? []) as {
        id: string;
        label: string;
        payload: Record<string, unknown>;
      }[],
    ])
  );

  return Response.json(
    {
      executions: executions.flat().map((execution) => ({
        ...execution,
        operationKey: undefined,
        output: sanitizeToolOutput(execution.output),
      })),

      mode: chat.mode,
      runs: runs.map(
        ({ executionOwner: _owner, executionLeaseUntil: _lease, ...visible }) =>
          visible
      ),
      steps: steps.flat(),
      suggestedActions: runActions,
    },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
