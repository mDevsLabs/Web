import { randomUUID } from "node:crypto";
import { getTeamSourceDefaults } from "../../src/teamPresetCatalog.js";
import type { ChatMessage } from "../threadStore.js";
import { assembleAgentToolPool } from "./agentToolPool.js";
import { resolveTeamExpertProfiles } from "./teamExpertProfiles.js";
import { isSimpleGoal } from "./simpleGoalDetector.js";
import {
  buildTeamPlanProposalId,
  registerTeamPlanApprovalWaiter,
  type TeamPlanApprovalPayload,
  unregisterTeamPlanApprovalWaiter,
} from "./teamPlanApprovalTool.js";
import type { TeamPeerRequest } from "./teamPeerRequestTool.js";
import { TeamTaskQueue } from "./teamTaskQueue.js";
import {
  rankReadyTasks,
  type TaskSchedulingStrategy,
} from "./teamTaskScheduler.js";
import {
  type PeerMailboxRequest,
  type SpecialistRunResult,
  type TeamOrchestratorInput,
  type TeamTask,
  TEAM_HANDOFF_TEXT_LIMIT,
  appendPlannerEscalationMessage,
  appendPlannerReviewRevisionMessage,
  applyPlanDiff,
  applyTeamClarificationAnswers,
  buildClarificationNeededNarrative,
  buildDiscussionFallbackPlan,
  buildFallbackTeamLeadNarrative,
  buildPeerMailboxMessages,
  buildPeerResponse,
  buildPlannerToolPool,
  buildTeamDeliveryText,
  clampTeamPacketText,
  findPeerTask,
  getReadyTasks,
  llmPlanTasks,
  materializePlannedTasks,
  runOneSpecialist,
  runPreflightReviewerAgent,
  runReviewerAgent,
  runTeamLeadFinalSynthesis,
  runTeamLeadQuickAnswer,
  serializeTeamPlanTasks,
  sleepWithAbort,
  syncQueueToPending,
} from "./team/index.js";


export * from "./team/index.js";

// ── Main orchestrator ────────────────────────────────────────────────────

export async function runTeamSession(
  input: TeamOrchestratorInput
): Promise<void> {
  const {
    settings,
    threadId,
    messages,
    modelSelection,
    resolvedModel,
    signal,
    thinkingLevel,
    workspaceRoot,
    extraReadableRoots,
    workspaceLspManager,
    hostWebContentsId,
    toolHooks,
    deferredToolState,
    onDeferredToolStateChange,
    toolResultReplacementState,
    onToolResultReplacementStateChange,
    emit,
    onDone,
    onError,
  } = input;

  try {
    const latestUser =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    let effectiveUserText = latestUser;

    const baseTeamTools = assembleAgentToolPool("team", {
      mcpToolDenyPrefixes: settings.mcpToolDenyPrefixes,
    });
    const resolvedExperts = resolveTeamExpertProfiles(
      settings.team,
      baseTeamTools
    );
    const { teamLead, specialists } = resolvedExperts;
    const plannerTools = buildPlannerToolPool(baseTeamTools);
    const rawConfiguredMaxParallel = Number(settings.team?.maxParallelExperts);
    const maxParallelExperts =
      Number.isFinite(rawConfiguredMaxParallel) && rawConfiguredMaxParallel > 0
        ? Math.max(1, Math.floor(rawConfiguredMaxParallel))
        : 3;

    if (!teamLead || specialists.length === 0) {
      onError(
        "Team mode requires at least one Team Lead and one enabled specialist."
      );
      return;
    }

    const checkAbort = () => {
      if (signal.aborted) {
        throw new Error("Team session aborted by user.");
      }
    };

    const hasCjkRequest = /[\u3400-\u9fff]/.test(effectiveUserText);
    const teamDefaults = getTeamSourceDefaults(settings.team?.source);
    let planningMessages = messages;

    // ── Phase 0: Simple-goal short-circuit ───────────────────────
    if (
      settings.team?.enableSimpleGoalShortCircuit &&
      isSimpleGoal(effectiveUserText)
    ) {
      checkAbort();
      emit({ phase: "delivering", threadId, type: "team_phase" });
      try {
        const quickAnswer = await runTeamLeadQuickAnswer({
          emit,
          hostWebContentsId,
          modelSelection,
          resolvedModel,
          settings,
          signal,
          teamLead,
          thinkingLevel,
          threadId,
          toolHooks,
          userRequest: effectiveUserText,
          workspaceLspManager,
          workspaceRoot,
        });
        onDone(quickAnswer, undefined, {
          leaderMessage: quickAnswer,
          phase: "delivering",
          planSummary: quickAnswer,
          reviewSummary: "",
          reviewVerdict: null,
          tasks: [],
        });
        return;
      } catch (err) {
        if (signal.aborted) throw err;
        // Fall through to normal team flow if quick answer fails.
      }
    }

    // ── Phase 1: Planning ────────────────────────────────────────
    let plannedTasks: TeamTask[] = [];
    let planSummary = "";
    let preflightSummary = "";
    let preflightVerdict: "ok" | "needs_clarification" | undefined;

    while (true) {
      checkAbort();
      emit({ phase: "planning", threadId, type: "team_phase" });

      plannedTasks = [];
      planSummary = "";
      preflightSummary = "";
      preflightVerdict = undefined;

      try {
        const planResult = await llmPlanTasks({
          deferredToolState,
          emit,
          extraReadableRoots,
          hostWebContentsId,
          messages: planningMessages,
          modelSelection,
          onDeferredToolStateChange,
          onToolResultReplacementStateChange,
          plannerTools,
          resolvedModel,
          settings,
          signal,
          specialists,
          teamLead,
          thinkingLevel,
          threadId,
          toolHooks,
          toolResultReplacementState,
          workspaceLspManager,
          workspaceRoot,
        });
        if (planResult.clarificationAnswers.length > 0) {
          const propagated = applyTeamClarificationAnswers(
            effectiveUserText,
            planningMessages,
            planResult.clarificationAnswers
          );
          effectiveUserText = propagated.userText;
          planningMessages = propagated.messages;
        }
        planSummary = planResult.planSummary;

        if (planResult.mode === "ANSWER") {
          const deliveryText =
            planSummary.trim() || buildFallbackTeamLeadNarrative(hasCjkRequest);
          emit({ summary: deliveryText, threadId, type: "team_plan_summary" });
          emit({ phase: "delivering", threadId, type: "team_phase" });
          onDone(deliveryText, undefined, {
            leaderMessage: deliveryText,
            phase: "delivering",
            planSummary: deliveryText,
            reviewSummary: "",
            reviewVerdict: null,
            tasks: [],
          });
          return;
        }

        if (planResult.mode === "CLARIFY") {
          const deliveryText =
            planSummary.trim() ||
            buildClarificationNeededNarrative(hasCjkRequest);
          emit({ summary: deliveryText, threadId, type: "team_plan_summary" });
          emit({ phase: "delivering", threadId, type: "team_phase" });
          onDone(deliveryText, undefined, {
            leaderMessage: deliveryText,
            phase: "delivering",
            planSummary: deliveryText,
            reviewSummary: "",
            reviewVerdict: null,
            tasks: [],
          });
          return;
        }

        if (planResult.tasks.length > 0) {
          plannedTasks = materializePlannedTasks(planResult.tasks, specialists);
        }
      } catch {
        const fallbackDiscussPlan = buildDiscussionFallbackPlan(
          effectiveUserText,
          specialists,
          hasCjkRequest
        );
        if (fallbackDiscussPlan) {
          planSummary = fallbackDiscussPlan.planSummary;
          plannedTasks = materializePlannedTasks(
            fallbackDiscussPlan.tasks,
            specialists
          );
        }
        if (plannedTasks.length > 0) {
          break;
        }
        const clarificationText =
          buildClarificationNeededNarrative(hasCjkRequest);
        emit({
          summary: clarificationText,
          threadId,
          type: "team_plan_summary",
        });
        emit({ phase: "delivering", threadId, type: "team_phase" });
        onDone(clarificationText, undefined, {
          leaderMessage: clarificationText,
          phase: "delivering",
          planSummary: clarificationText,
          reviewSummary: "",
          reviewVerdict: null,
          tasks: [],
        });
        return;
      }

      if (plannedTasks.length === 0) {
        const fallbackDiscussPlan = buildDiscussionFallbackPlan(
          effectiveUserText,
          specialists,
          hasCjkRequest
        );
        if (fallbackDiscussPlan) {
          planSummary = fallbackDiscussPlan.planSummary;
          plannedTasks = materializePlannedTasks(
            fallbackDiscussPlan.tasks,
            specialists
          );
        }
      }

      if (plannedTasks.length === 0) {
        const clarificationText =
          buildClarificationNeededNarrative(hasCjkRequest);
        emit({
          summary: clarificationText,
          threadId,
          type: "team_plan_summary",
        });
        emit({ phase: "delivering", threadId, type: "team_phase" });
        onDone(clarificationText, undefined, {
          leaderMessage: clarificationText,
          phase: "delivering",
          planSummary: clarificationText,
          reviewSummary: "",
          reviewVerdict: null,
          tasks: [],
        });
        return;
      }

      emit({ summary: planSummary, threadId, type: "team_plan_summary" });

      const isPureDiscussPlan =
        plannedTasks.length > 0 &&
        plannedTasks.every((task) => task.kind === "discuss");

      // ── Phase 1.25: Preflight requirement/plan review ────────────

      const enablePreflightReview =
        settings.team?.enablePreflightReview ??
        teamDefaults.enablePreflightReview;
      if (
        enablePreflightReview &&
        resolvedExperts.planReviewer &&
        !isPureDiscussPlan
      ) {
        checkAbort();
        emit({ phase: "preflight", threadId, type: "team_phase" });
        try {
          const preflight = await runPreflightReviewerAgent({
            baseTools: baseTeamTools,
            deferredToolState,
            emit,
            extraReadableRoots,
            hostWebContentsId,
            modelSelection,
            onDeferredToolStateChange,
            onToolResultReplacementStateChange,
            plannedTasks,
            planSummary,
            resolvedModel,
            reviewer: resolvedExperts.planReviewer,
            settings,
            signal,
            specialists,
            thinkingLevel,
            threadId,
            toolHooks,
            toolResultReplacementState,
            userRequest: effectiveUserText,
            workspaceLspManager,
            workspaceRoot,
          });
          preflightSummary = preflight.summary;
          preflightVerdict = preflight.verdict;
          emit({
            summary: preflight.summary,
            threadId,
            type: "team_preflight_review",
            verdict: preflight.verdict,
          });
        } catch (err) {
          if (signal.aborted) throw err;
          // Non-fatal — continue without preflight notes.
        }
      }

      if (preflightVerdict === "needs_clarification") {
        const deliveryText =
          preflightSummary.trim() ||
          buildClarificationNeededNarrative(hasCjkRequest);
        emit({ summary: deliveryText, threadId, type: "team_plan_summary" });
        emit({ phase: "delivering", threadId, type: "team_phase" });
        onDone(deliveryText, undefined, {
          leaderMessage: planSummary,
          phase: "delivering",
          planSummary,
          reviewSummary: preflightSummary || deliveryText,
          reviewVerdict: null,
          tasks: [],
        });
        return;
      }

      break;
    }

    // ── Phase 1.5: Plan proposal — await user approval ───────────

    const requirePlanApproval =
      settings.team?.requirePlanApproval ?? teamDefaults.requirePlanApproval;
    if (requirePlanApproval) {
      checkAbort();
      emit({ phase: "proposing", threadId, type: "team_phase" });
      const proposalId = buildTeamPlanProposalId(threadId);
      emit({
        proposalId,
        summary: planSummary,
        tasks: plannedTasks.map((t) => ({
          acceptanceCriteria: t.acceptanceCriteria,
          dependencies: t.dependencies,
          expert: t.expertAssignmentKey || t.expertId,
          expertName: t.expertName,
          roleType: t.roleType,
          task: t.description,
        })),
        threadId,
        type: "team_plan_proposed",
        ...(preflightSummary ? { preflightSummary } : {}),
        ...(preflightVerdict ? { preflightVerdict } : {}),
      });

      const decision = await new Promise<TeamPlanApprovalPayload>(
        (resolve, reject) => {
          if (signal.aborted) {
            reject(new Error("Team session aborted by user."));
            return;
          }
          const onAbort = () => {
            unregisterTeamPlanApprovalWaiter(proposalId);
            reject(new Error("Team session aborted by user."));
          };
          signal.addEventListener("abort", onAbort, { once: true });
          registerTeamPlanApprovalWaiter(proposalId, (payload) => {
            signal.removeEventListener("abort", onAbort);
            resolve(payload);
          });
        }
      );

      emit({
        approved: decision.approved,
        proposalId,
        threadId,
        type: "team_plan_decision",
      });

      if (!decision.approved) {
        emit({ phase: "cancelled", threadId, type: "team_phase" });
        const feedback = decision.feedbackText?.trim();
        const hasCjk = /[\u3400-\u9fff]/.test(effectiveUserText);
        const cancelledLine = hasCjk
          ? "方案已取消。你可以调整需求后重新发送。"
          : "Plan cancelled. Adjust your request and send again when ready.";
        const deliveryText = feedback
          ? `${cancelledLine}\n\n${hasCjk ? "用户备注" : "Your feedback"}: ${feedback}`
          : cancelledLine;
        onDone(deliveryText, undefined, {
          leaderMessage: planSummary,
          phase: "delivering",
          planSummary,
          reviewSummary: preflightSummary,
          reviewVerdict: null,
          tasks: [],
        });
        return;
      }

      // Optional: incorporate user feedback text as an extra hint for specialists.
      const feedback = decision.feedbackText?.trim();
      if (feedback) {
        effectiveUserText = `${effectiveUserText}\n\n[User feedback on plan]\n${feedback}`;
      }
    }

    for (const [index, task] of plannedTasks.entries()) {
      emit({
        task: {
          acceptanceCriteria: task.acceptanceCriteria,
          dependencies: task.dependencies,
          description: task.description,
          expertAssignmentKey: task.expertAssignmentKey,
          expertId: task.expertId,
          expertName: task.expertName,
          id: task.id,
          roleType: task.roleType,
          status: task.status,
        },
        threadId,
        type: "team_task_created",
      });
      if (index < plannedTasks.length - 1) {
        await sleepWithAbort(450, signal);
      }
    }

    // ── Phase 2: Dependency-aware parallel execution ─────────────

    checkAbort();
    emit({ phase: "executing", threadId, type: "team_phase" });
    const queue = new TeamTaskQueue();
    queue.addBatch(plannedTasks);
    const pending = [...plannedTasks];
    const completed: TeamTask[] = [];
    const completedIds = new Set<string>();
    const completedTasksById = new Map<string, TeamTask>();
    const activeTaskIds = new Set<string>();
    const peerMailbox = new Map<string, Map<string, PeerMailboxRequest>>();
    const maxConsecutiveFailedBatches = 2;
    let consecutiveFailedBatches = 0;
    let replanBudget = 2;
    let reviewReplanBudget = 2;
    const peerResponseTimeoutMs = 15_000;

    const clearPeerRequest = (
      targetTaskId: string,
      requestId: string
    ): PeerMailboxRequest | null => {
      const requests = peerMailbox.get(targetTaskId);
      const request = requests?.get(requestId) ?? null;
      if (!request) {
        return null;
      }
      if (request.timer) {
        clearTimeout(request.timer);
        request.timer = null;
      }
      requests?.delete(requestId);
      if (requests && requests.size === 0) {
        peerMailbox.delete(targetTaskId);
      }
      return request;
    };

    const resolveOutstandingPeerRequestsForTask = (
      task: TeamTask,
      fallbackText: string
    ) => {
      const requests = peerMailbox.get(task.id);
      if (!requests || requests.size === 0) {
        return;
      }
      for (const request of [...requests.values()]) {
        clearPeerRequest(task.id, request.requestId);
        request.resolve(
          [
            `${task.expertName} finished without a direct peer reply.`,
            "Latest output:",
            clampTeamPacketText(
              fallbackText || task.result,
              TEAM_HANDOFF_TEXT_LIMIT
            ),
          ].join("\n")
        );
      }
    };

    const pullPeerMailboxMessages = async (
      task: TeamTask
    ): Promise<ChatMessage[]> => {
      const requests = [...(peerMailbox.get(task.id)?.values() ?? [])];
      if (requests.length === 0) {
        return [];
      }
      for (const request of requests) {
        request.deliveredCount += 1;
      }
      emit({
        expertId: task.expertId,
        message: `Received ${requests.length} peer request(s) while still running.`,
        taskId: task.id,
        threadId,
        type: "team_expert_progress",
      });
      return buildPeerMailboxMessages(requests, task);
    };

    const waitForRunningPeerReply = async (
      requestingTask: TeamTask,
      request: TeamPeerRequest
    ): Promise<string> => {
      const targetTask = findPeerTask(plannedTasks, request.targetExpertId);
      if (!targetTask) {
        return `No peer specialist matched "${request.targetExpertId}".`;
      }
      if (targetTask.id === requestingTask.id) {
        return "You cannot request information from yourself.";
      }
      const completedTask = completedTasksById.get(targetTask.id);
      if (completedTask) {
        return buildPeerResponse(request, completedTasksById, plannedTasks);
      }
      if (!activeTaskIds.has(targetTask.id)) {
        return `${targetTask.expertName} is not currently running. Only running or completed peers are available.`;
      }
      return await new Promise<string>((resolve) => {
        const requestId = `peer-request-${randomUUID()}`;
        const targetRequests =
          peerMailbox.get(targetTask.id) ??
          new Map<string, PeerMailboxRequest>();
        const mailboxRequest: PeerMailboxRequest = {
          deliveredCount: 0,
          fromExpertId: requestingTask.expertId,
          fromExpertName: requestingTask.expertName,
          fromRoleType: requestingTask.roleType,
          fromTaskId: requestingTask.id,
          question: request.question,
          requestId,
          resolve,
          timer: null,
        };
        mailboxRequest.timer = setTimeout(() => {
          clearPeerRequest(targetTask.id, requestId);
          resolve(`${targetTask.expertName} did not respond in time.`);
        }, peerResponseTimeoutMs);
        targetRequests.set(requestId, mailboxRequest);
        peerMailbox.set(targetTask.id, targetRequests);
      });
    };

    let review: { verdict: "approved" | "revision_needed"; summary: string } = {
      summary: "",
      verdict: "approved",
    };

    while (true) {
      while (pending.length > 0 || queue.getPendingOrBlocked().length > 0) {
        checkAbort();
        syncQueueToPending(
          queue,
          pending,
          completed,
          completedIds,
          completedTasksById
        );

        const ready = getReadyTasks(pending, completedIds);
        if (ready.length === 0) {
          if (activeTaskIds.size > 0) {
            // Tasks still running; wait for next iteration.
            break;
          }
          // No ready tasks and nothing running: cascade fail remaining stuck tasks.
          for (const task of pending) {
            queue.fail(task.id, "Stuck: unresolvable dependency.");
          }
          syncQueueToPending(
            queue,
            pending,
            completed,
            completedIds,
            completedTasksById
          );
          break;
        }

        const strategy =
          (settings.team?.taskSchedulingStrategy as TaskSchedulingStrategy) ??
          "dependency-first";
        const rankedReady = rankReadyTasks(
          ready,
          plannedTasks,
          specialists,
          activeTaskIds,
          strategy
        );
        const batch = rankedReady.slice(0, maxParallelExperts);
        for (const bt of batch) {
          const idx = pending.indexOf(bt);
          if (idx !== -1) pending.splice(idx, 1);
        }

        // 用 Promise.race 确保 abort 信号能立即中断 Promise.all，
        // 避免 agent loop 因 AbortSignal 事件监听器竞态而不停止
        const abortPromise = new Promise<never>((_, reject) => {
          if (signal.aborted) {
            reject(new Error("Team session aborted by user."));
            return;
          }
          signal.addEventListener(
            "abort",
            () => {
              reject(new Error("Team session aborted by user."));
            },
            { once: true }
          );
        });

        type BatchResult = {
          emittedDone: boolean;
          result: SpecialistRunResult;
          task: TeamTask;
        };

        const results: BatchResult[] = await Promise.race([
          Promise.all(
            batch.map(async (task: TeamTask) => {

              if (signal.aborted)
                throw new Error("Team session aborted by user.");
              const expert =
                specialists.find((s) => s.id === task.expertId) ??
                specialists[0]!;
              activeTaskIds.add(task.id);
              emit({
                expertId: task.expertId,
                taskId: task.id,
                threadId,
                type: "team_expert_started",
              });
              try {
                const result = await runOneSpecialist({
                  allTasks: plannedTasks,
                  baseTools: baseTeamTools,
                  completedTasksById,
                  deferredToolState,
                  emit,
                  expert,
                  extraReadableRoots,
                  handlePeerReply: (reply) => {
                    const resolved = clearPeerRequest(task.id, reply.requestId);
                    resolved?.resolve(reply.answer);
                  },
                  handlePeerRequest: (request) =>
                    waitForRunningPeerReply(task, request),
                  hostWebContentsId,
                  modelSelection,
                  onDeferredToolStateChange,
                  onToolResultReplacementStateChange,
                  planSummary,
                  pullPeerMailboxMessages: () => pullPeerMailboxMessages(task),
                  resolvedModel,
                  settings,
                  signal,
                  task,
                  thinkingLevel,
                  threadId,
                  toolHooks,
                  toolResultReplacementState,
                  userRequest: effectiveUserText,
                  workspaceLspManager,
                  workspaceRoot,
                });
                const emittedDone = !signal.aborted && !result.escalation;
                if (emittedDone) {
                  emit({
                    expertId: task.expertId,
                    result: result.text,
                    success: result.success,
                    taskId: task.id,
                    threadId,
                    type: "team_expert_done",
                  });
                }
                return { emittedDone, result, task };
              } finally {
                activeTaskIds.delete(task.id);
              }
            })
          ),
          abortPromise,
        ]);

        const escalatedItems = results.filter((item) => item.result.escalation);
        const settledItems = results.filter((item) => !item.result.escalation);

        for (const item of settledItems) {
          resolveOutstandingPeerRequestsForTask(item.task, item.result.text);
          if (item.result.success) {
            queue.complete(item.task.id, item.result.text);
          } else {
            queue.fail(item.task.id, item.result.text);
          }
        }
        syncQueueToPending(
          queue,
          pending,
          completed,
          completedIds,
          completedTasksById
        );

        if (escalatedItems.length > 0) {
          const primaryEscalation = escalatedItems[0]!;
          const replanCandidates = [
            ...escalatedItems.map((item) => item.task),
            ...pending,
          ];
          if (replanBudget > 0) {
            replanBudget -= 1;
            planningMessages = appendPlannerEscalationMessage(
              planningMessages,
              {
                completedTasks: completed,
                escalation: primaryEscalation.result.escalation!,
                task: primaryEscalation.task,
              }
            );
            emit({ phase: "planning", threadId, type: "team_phase" });

            try {
              const revisedPlan = await llmPlanTasks({
                deferredToolState,
                emit,
                extraReadableRoots,
                hostWebContentsId,
                messages: planningMessages,
                modelSelection,
                onDeferredToolStateChange,
                onToolResultReplacementStateChange,
                plannerTools,
                resolvedModel,
                settings,
                signal,
                specialists,
                teamLead,
                thinkingLevel,
                threadId,
                toolHooks,
                toolResultReplacementState,
                workspaceLspManager,
                workspaceRoot,
              });
              if (revisedPlan.clarificationAnswers.length > 0) {
                const propagated = applyTeamClarificationAnswers(
                  effectiveUserText,
                  planningMessages,
                  revisedPlan.clarificationAnswers
                );
                effectiveUserText = propagated.userText;
                planningMessages = propagated.messages;
              }

              if (
                revisedPlan.mode !== "PLAN" ||
                revisedPlan.tasks.length === 0
              ) {
                const deliveryText =
                  revisedPlan.planSummary.trim() ||
                  buildClarificationNeededNarrative(hasCjkRequest);
                emit({
                  summary: deliveryText,
                  threadId,
                  type: "team_plan_summary",
                });
                emit({ phase: "delivering", threadId, type: "team_phase" });
                onDone(deliveryText, undefined, {
                  leaderMessage: deliveryText,
                  phase: "delivering",
                  planSummary: deliveryText,
                  reviewSummary: "",
                  reviewVerdict: null,
                  tasks: completed.map((task) => ({
                    acceptanceCriteria: task.acceptanceCriteria,
                    dependencies: task.dependencies,
                    description: task.description,
                    expertAssignmentKey: task.expertAssignmentKey,
                    expertId: task.expertId,
                    expertName: task.expertName,
                    id: task.id,
                    result: task.result,
                    roleType: task.roleType,
                    status: task.status,
                  })),
                });
                return;
              }

              const revisedPendingTasks = materializePlannedTasks(
                revisedPlan.tasks,
                specialists,
                replanCandidates
              );
              const diff = applyPlanDiff(replanCandidates, revisedPendingTasks);
              // Sync replan into queue.
              for (const task of queue.list()) {
                if (
                  task.status !== "completed" &&
                  task.status !== "failed" &&
                  task.status !== "revision"
                ) {
                  queue.remove(task.id);
                }
              }
              queue.addBatch(diff.nextPendingTasks);
              syncQueueToPending(
                queue,
                pending,
                completed,
                completedIds,
                completedTasksById
              );
              plannedTasks = [...queue.list()];
              planSummary = revisedPlan.planSummary;
              consecutiveFailedBatches = 0;

              emit({
                summary: planSummary,
                threadId,
                type: "team_plan_summary",
              });
              emit({
                addedTaskIds: diff.addedTasks.map((task) => task.id),
                keptTaskIds: diff.keptTasks.map((task) => task.id),
                reason: primaryEscalation.result.escalation!.reason,
                removedTaskIds: diff.removedTasks.map((task) => task.id),
                revisionId: `team-plan-revision-${randomUUID()}`,
                summary: planSummary,
                tasks: serializeTeamPlanTasks(pending),
                threadId,
                type: "team_plan_revised",
              });
              emit({ phase: "executing", threadId, type: "team_phase" });
              continue;
            } catch {
              // Fall through to mark the escalated task as needing revision.
            }
          }

          for (const item of escalatedItems) {
            const resultText =
              replanBudget <= 0
                ? `${item.result.text}\n\nReplan budget exhausted; reviewer should inspect this escalation.`
                : item.result.text;
            resolveOutstandingPeerRequestsForTask(item.task, resultText);
            if (!item.emittedDone && !signal.aborted) {
              emit({
                expertId: item.task.expertId,
                result: resultText,
                success: false,
                taskId: item.task.id,
                threadId,
                type: "team_expert_done",
              });
            }
            const revisionTask: TeamTask = {
              ...item.task,
              result: resultText,
              status: "revision",
            };
            completed.push(revisionTask);
            completedTasksById.set(revisionTask.id, revisionTask);
            queue.update(item.task.id, {
              result: resultText,
              status: "revision",
            });
          }
        }

        const failedInBatch = [...settledItems, ...escalatedItems].filter(
          (item) => !item.result.success
        ).length;
        consecutiveFailedBatches =
          failedInBatch === results.length ? consecutiveFailedBatches + 1 : 0;

        if (
          pending.length > 0 &&
          consecutiveFailedBatches >= maxConsecutiveFailedBatches
        ) {
          const fallback =
            "Skipped due to repeated specialist failures (team circuit breaker triggered).";
          for (const task of pending.splice(0, pending.length)) {
            emit({
              expertId: task.expertId,
              result: fallback,
              success: false,
              taskId: task.id,
              threadId,
              type: "team_expert_done",
            });
            queue.fail(task.id, fallback);
          }
          syncQueueToPending(
            queue,
            pending,
            completed,
            completedIds,
            completedTasksById
          );
          break;
        }
      }

      // ── Phase 3: LLM-based review ────────────────────────────────

      checkAbort();
      emit({ phase: "reviewing", threadId, type: "team_phase" });

      const reviewingPureDiscuss =
        completed.length > 0 &&
        completed.every((task) => task.kind === "discuss");

      if (resolvedExperts.deliveryReviewer && !reviewingPureDiscuss) {
        checkAbort();
        review = await runReviewerAgent({
          baseTools: baseTeamTools,
          completedTasks: completed,
          deferredToolState,
          emit,
          extraReadableRoots,
          hostWebContentsId,
          modelSelection,
          onDeferredToolStateChange,
          onToolResultReplacementStateChange,
          planSummary,
          resolvedModel,
          reviewer: resolvedExperts.deliveryReviewer,
          settings,
          signal,
          thinkingLevel,
          threadId,
          toolHooks,
          toolResultReplacementState,
          userRequest: effectiveUserText,
          workspaceLspManager,
          workspaceRoot,
        });
      } else {
        const failed = completed.filter(
          (t) => t.status === "failed" || t.status === "revision"
        );
        review =
          failed.length > 0
            ? {
                summary: `${failed.length} task(s) need revision.`,
                verdict: "revision_needed",
              }
            : {
                summary: `All ${completed.length} task(s) completed successfully.`,
                verdict: "approved",
              };
      }

      emit({
        summary: review.summary,
        threadId,
        type: "team_review",
        verdict: review.verdict,
      });

      if (review.verdict !== "revision_needed" || reviewReplanBudget <= 0) {
        break;
      }

      reviewReplanBudget -= 1;
      planningMessages = appendPlannerReviewRevisionMessage(planningMessages, {
        completedTasks: completed,
        reviewSummary: review.summary,
      });
      emit({ phase: "planning", threadId, type: "team_phase" });

      try {
        const revisedPlan = await llmPlanTasks({
          deferredToolState,
          emit,
          extraReadableRoots,
          hostWebContentsId,
          messages: planningMessages,
          modelSelection,
          onDeferredToolStateChange,
          onToolResultReplacementStateChange,
          plannerTools,
          resolvedModel,
          settings,
          signal,
          specialists,
          teamLead,
          thinkingLevel,
          threadId,
          toolHooks,
          toolResultReplacementState,
          workspaceLspManager,
          workspaceRoot,
        });
        if (revisedPlan.clarificationAnswers.length > 0) {
          const propagated = applyTeamClarificationAnswers(
            effectiveUserText,
            planningMessages,
            revisedPlan.clarificationAnswers
          );
          effectiveUserText = propagated.userText;
          planningMessages = propagated.messages;
        }

        if (revisedPlan.mode === "PLAN" && revisedPlan.tasks.length > 0) {
          const revisedPendingTasks = materializePlannedTasks(
            revisedPlan.tasks,
            specialists,
            completed
          );
          const diff = applyPlanDiff([], revisedPendingTasks);
          const revisedIds = new Set(
            revisedPendingTasks.map((task) => task.id)
          );
          // Sync into queue: keep only completed tasks that are still in the revised plan.
          for (const task of queue.list()) {
            if (task.status === "completed" && revisedIds.has(task.id)) {
              continue;
            }
            queue.remove(task.id);
          }
          queue.addBatch(revisedPendingTasks);
          // Clear legacy arrays and resync.
          completed.length = 0;
          completedIds.clear();
          completedTasksById.clear();
          syncQueueToPending(
            queue,
            pending,
            completed,
            completedIds,
            completedTasksById
          );
          plannedTasks = [...queue.list()];
          planSummary = revisedPlan.planSummary;
          consecutiveFailedBatches = 0;

          emit({ summary: planSummary, threadId, type: "team_plan_summary" });
          emit({
            addedTaskIds: diff.addedTasks.map((task) => task.id),
            keptTaskIds: diff.keptTasks.map((task) => task.id),
            reason: review.summary,
            removedTaskIds: diff.removedTasks.map((task) => task.id),
            revisionId: `team-plan-revision-${randomUUID()}`,
            summary: planSummary,
            tasks: serializeTeamPlanTasks(pending),
            threadId,
            type: "team_plan_revised",
          });
          emit({ phase: "executing", threadId, type: "team_phase" });
          continue;
        }
      } catch {
        // Fall through to final delivery with the current review result.
      }

      break;
    }

    // ── Phase 3.5: Team Lead final synthesis ─────────────────────

    checkAbort();
    let finalSummary = "";
    if (completed.length > 0) {
      emit({ phase: "synthesizing", threadId, type: "team_phase" });
      try {
        finalSummary = await runTeamLeadFinalSynthesis({
          completedTasks: completed,
          deferredToolState,
          emit,
          extraReadableRoots,
          hasCjk: hasCjkRequest,
          hostWebContentsId,
          modelSelection,
          onDeferredToolStateChange,
          onToolResultReplacementStateChange,
          planSummary,
          resolvedModel,
          review,
          settings,
          signal,
          teamLead,
          thinkingLevel,
          threadId,
          toolHooks,
          toolResultReplacementState,
          userRequest: effectiveUserText,
          workspaceLspManager,
          workspaceRoot,
        });
      } catch (err) {
        if (signal.aborted) throw err;
        // Non-fatal — fall back to the planning summary.
      }
      if (finalSummary) {
        emit({ summary: finalSummary, threadId, type: "team_lead_final" });
      }
    }

    // ── Phase 4: Delivery ────────────────────────────────────────

    checkAbort();
    emit({ phase: "delivering", threadId, type: "team_phase" });

    const delivery = buildTeamDeliveryText({
      completedTasks: completed,
      finalSummary,
      hasCjkRequest,
      planSummary,
      review,
      teamLeadName: teamLead.name,
    });

    onDone(delivery, undefined, {
      leaderMessage: finalSummary || planSummary,
      phase: "delivering",
      planSummary,
      reviewSummary: review.summary,
      reviewVerdict: review.verdict,
      tasks: completed.map((t) => ({
        acceptanceCriteria: t.acceptanceCriteria,
        dependencies: t.dependencies,
        description: t.description,
        expertAssignmentKey: t.expertAssignmentKey,
        expertId: t.expertId,
        expertName: t.expertName,
        id: t.id,
        result: t.result,
        roleType: t.roleType,
        status: t.status,
      })),
      ...(finalSummary ? { finalSummary } : {}),
    });
  } catch (error) {
    if (signal.aborted) {
      onError("Team session aborted by user.");
    } else {
      onError(error instanceof Error ? error.message : String(error));
    }
  }
}
