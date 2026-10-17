import { randomUUID } from "node:crypto";
import { flattenAssistantTextPartsForSearch } from "../../../src/agentStructuredMessage.js";
import type { ShellSettings, TeamRoleType } from "../../settingsStore.js";
import type { ChatMessage, DeferredToolState } from "../../threadStore.js";
import { resolveModelRequest } from "../../llm/modelResolve.js";
import { type AgentLoopHandlers, type AgentLoopOptions, runAgentLoop } from "../agentLoop.js";
import { AGENT_TOOLS, type AgentToolDef, isReadOnlyAgentTool } from "../agentTools.js";
import { executeAskPlanQuestionTool } from "../planQuestionTool.js";
import { extractRequestUserInputAnswers } from "../requestUserInputTool.js";
import type { TeamEscalation } from "../teamEscalateTool.js";
import type { TeamExpertRuntimeProfile } from "../teamExpertProfiles.js";
import {
  setTeamPlanDecideRuntime,
  type TeamPlanDecision,
  teamPlanDecideTool,
} from "../teamPlanDecideTool.js";
import type { ToolExecutionHooks } from "../toolExecutor.js";
import type { WorkspaceLspManager } from "../../lsp/workspaceLspManager.js";
import type {
  LeadPlanMode,
  LLMPlannedTask,
  TeamEmit,
  TeamOrchestratorInput,
  TeamTask,
} from "./teamTypes.js";
import {
  appendTeamLanguageRule,
  createTeamRoleScope,
  toLlmPlannedTasks,
} from "./teamTypes.js";
import {
  buildPlanTaskSignature,
  buildPlanTaskSignatureFromTask,
  buildTeamUserInputHandlers,
  clampTeamPacketText,
  normalizeTeamTaskKey,
  TEAM_HANDOFF_TEXT_LIMIT,
} from "./teamUtils.js";



function appendTeamClarificationMessage(
  messages: ChatMessage[],
  answer: string
): ChatMessage[] {
  return [
    ...messages,
    {
      content: [
        "[TEAM CLARIFICATION ANSWER]",
        answer,
        "",
        "Continue Team planning using this answer. Do not ask the same clarification again.",
      ].join("\n"),
      role: "user",
    },
  ];
}

function matchExpert(
  expertKey: string,
  specialists: TeamExpertRuntimeProfile[]
): TeamExpertRuntimeProfile | undefined {
  const key = expertKey.toLowerCase().trim();
  return (
    specialists.find((s) => s.id.toLowerCase() === key) ??
    specialists.find((s) => s.assignmentKey.toLowerCase() === key) ??
    specialists.find((s) => s.roleType === key) ??
    specialists.find((s) => s.name.toLowerCase() === key) ??
    specialists.find(
      (s) => s.roleType.includes(key) || key.includes(s.roleType)
    ) ??
    specialists.find(
      (s) => s.assignmentKey.includes(key) || key.includes(s.assignmentKey)
    )
  );
}


function stripFencedBlocks(text: string): string {
  const closed = text.replace(/```[\s\S]*?```/g, "");
  // Also drop a trailing unclosed fence block that is still streaming in.
  const unclosed = closed.replace(/```[\s\S]*$/m, "");
  return unclosed.trim();
}

function stripDetailsBlocks(text: string): string {
  return text.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "").trim();
}

function stripTrailingRawJson(text: string): string {
  const normalized = text.trim();
  if (!normalized) {
    return "";
  }
  const lines = normalized.split("\n");
  const rawJsonStart = lines.findIndex(
    (line, index) => index > 0 && /^[\s]*[[{]/.test(line)
  );
  if (rawJsonStart <= 0) {
    return normalized;
  }
  return lines.slice(0, rawJsonStart).join("\n").trim();
}

function extractTeamLeadNarrative(text: string): string {
  const raw = flattenAssistantTextPartsForSearch(String(text ?? ""));
  const normalized = raw.trim();
  if (!normalized) {
    return "";
  }
  const withoutFence = stripFencedBlocks(normalized);
  const withoutDetails = stripDetailsBlocks(withoutFence || normalized);
  const withoutJson = stripTrailingRawJson(
    withoutDetails || withoutFence || normalized
  );
  return (withoutJson || withoutDetails || withoutFence || normalized)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildFallbackTeamLeadNarrative(hasCjk: boolean): string {
  return hasCjk
    ? "我已开始逐个分派合适的成员处理任务，接下来会汇总他们的反馈再向你汇报。"
    : "I have started assigning the right specialists one by one, and I will report back after collecting their findings.";
}

function buildClarificationNeededNarrative(hasCjk: boolean): string {
  return hasCjk
    ? "当前需求还不够具体，我先不分派专家。请补充你最想解决的问题、希望聚焦的方向、限制条件，以及你希望得到的产出。"
    : "The request is still too broad, so I am not dispatching specialists yet. Please clarify the main problem to solve, the direction to focus on, any constraints, and the outcome you want.";
}

const DISCUSS_INTENT_PATTERNS = [
  /思路/,
  /想法/,
  /建议/,
  /方向/,
  /点子/,
  /创意/,
  /头脑风暴/,
  /脑暴/,
  /brainstorm/i,
  /\bideas?\b/i,
  /\boptions?\b/i,
  /\bpros?\s+and\s+cons\b/i,
  /方案对比/,
  /帮我想想/,
  /你觉得/,
  /有什么好的/,
];

const DELIVERY_INTENT_PATTERNS = [
  /帮我实现/,
  /实现一下/,
  /写一下/,
  /加上/,
  /修一下/,
  /开发/,
  /落地/,
  /原型/,
  /\bbuild\b/i,
  /\bimplement\b/i,
  /\bship\b/i,
  /\bfix\b/i,
  /\brefactor\b/i,
  /\badd\b/i,
];

function hasDiscussionIntent(text: string): boolean {
  const normalized = String(text ?? "").trim();
  return DISCUSS_INTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function hasDeliveryIntent(text: string): boolean {
  const normalized = String(text ?? "").trim();
  return DELIVERY_INTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function classifyDiscussFallbackAngle(
  expert: Pick<
    TeamExpertRuntimeProfile,
    "assignmentKey" | "name" | "summary" | "roleType"
  >
): "design" | "psychology" | "marketing" | "technical" | "general" {
  const haystack = [
    expert.assignmentKey,
    expert.name,
    expert.summary,
    expert.roleType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    /game|design|designer|玩法|机制|策划|product|ux|interaction|creative/.test(
      haystack
    )
  ) {
    return "design";
  }
  if (
    /psych|behavior|research|mind|emotion|心理|行为|认知|research/.test(
      haystack
    )
  ) {
    return "psychology";
  }
  if (
    /market|growth|content|brand|social|viral|xiaohongshu|douyin|传播|营销|增长|社交|内容/.test(
      haystack
    )
  ) {
    return "marketing";
  }
  if (
    /frontend|backend|qa|engineer|developer|test|risk|可靠|技术|工程|测试/.test(
      haystack
    )
  ) {
    return "technical";
  }
  return "general";
}

function buildDiscussFallbackTask(
  expert: TeamExpertRuntimeProfile,
  hasCjk: boolean
): LLMPlannedTask {
  const angle = classifyDiscussFallbackAngle(expert);
  if (hasCjk) {
    if (angle === "design") {
      return {
        acceptanceCriteria: [
          "至少提出 3 个具体方向或机制",
          "说明每个方向为什么容易引发讨论、分享或吐槽",
          "比较主要优缺点与风险",
        ],
        dependencies: [],
        expert: expert.assignmentKey,
        kind: "discuss",
        task: "从核心机制与体验设计角度，提出 3 个最容易形成话题传播的方向，并比较优缺点。",
      };
    }
    if (angle === "psychology") {
      return {
        acceptanceCriteria: [
          "总结至少 3 种有效的心理或情绪触发机制",
          "解释这些机制为什么会促发讨论、分享或复玩",
          "指出潜在反噬风险或用户厌恶点",
        ],
        dependencies: [],
        expert: expert.assignmentKey,
        kind: "discuss",
        task: "从用户心理、情绪触发与行为动机角度，分析什么样的设计最容易驱动分享、复玩和社交扩散。",
      };
    }
    if (angle === "marketing") {
      return {
        acceptanceCriteria: [
          "提出至少 5 个可传播的话题钩子或挑战方向",
          "说明这些钩子适合在哪类社交场景扩散",
          "指出最大的执行风险或平台限制",
        ],
        dependencies: [],
        expert: expert.assignmentKey,
        kind: "discuss",
        task: "从传播裂变、社交平台话题与内容包装角度，提出最容易形成扩散的传播钩子与玩法包装方式。",
      };
    }
    if (angle === "technical") {
      return {
        acceptanceCriteria: [
          "指出最值得保留的 3 个方向或机制",
          "说明每个方向的主要实现或运营风险",
          "提醒最容易翻车的设计点",
        ],
        dependencies: [],
        expert: expert.assignmentKey,
        kind: "discuss",
        task: "从可实现性、节奏控制、作弊风险与长期新鲜感角度，指出哪些思路更稳妥，哪些坑需要避免。",
      };
    }
    return {
      acceptanceCriteria: [
        "至少提出 3 个具体方向",
        "说明每个方向为何有传播或讨论潜力",
        "指出最大的风险或副作用",
      ],
      dependencies: [],
      expert: expert.assignmentKey,
      kind: "discuss",
      task: "从你的专业视角给出 3 个能够显著提升话题性的具体方向，并说明为什么值得优先考虑。",
    };
  }
  if (angle === "design") {
    return {
      acceptanceCriteria: [
        "Propose at least 3 concrete directions or mechanics",
        "Explain why each direction could trigger discussion or sharing",
        "Compare the main trade-offs and risks",
      ],
      dependencies: [],
      expert: expert.assignmentKey,
      kind: "discuss",
      task: "From the mechanism and experience-design angle, propose 3 distinct directions that could naturally generate discussion and sharing, then compare the trade-offs.",
    };
  }
  if (angle === "psychology") {
    return {
      acceptanceCriteria: [
        "Name at least 3 strong psychological or emotional triggers",
        "Explain why each trigger drives sharing or replay",
        "Call out backlash risks or fatigue risks",
      ],
      dependencies: [],
      expert: expert.assignmentKey,
      kind: "discuss",
      task: "From the user-psychology and emotional-trigger angle, analyze which designs are most likely to drive sharing, replay, and social spread.",
    };
  }
  if (angle === "marketing") {
    return {
      acceptanceCriteria: [
        "Propose at least 5 discussion hooks or challenge formats",
        "Explain where each hook spreads best",
        "Call out the main execution risk or platform constraint",
      ],
      dependencies: [],
      expert: expert.assignmentKey,
      kind: "discuss",
      task: "From the distribution, social-spread, and packaging angle, propose the strongest hooks or framing devices for organic discussion.",
    };
  }
  if (angle === "technical") {
    return {
      acceptanceCriteria: [
        "Highlight 3 directions or mechanics worth keeping",
        "Explain the main execution or operational risk for each",
        "Flag the easiest ways the concept could fail",
      ],
      dependencies: [],
      expert: expert.assignmentKey,
      kind: "discuss",
      task: "From the feasibility, pacing, anti-abuse, and longevity angle, identify which directions are safest to pursue and which traps to avoid.",
    };
  }
  return {
    acceptanceCriteria: [
      "Propose at least 3 concrete directions",
      "Explain why each one has discussion or sharing potential",
      "Call out the biggest downside or risk",
    ],
    dependencies: [],
    expert: expert.assignmentKey,
    kind: "discuss",
    task: "From your specialty, propose 3 concrete directions that could materially increase discussion value, and explain why they are worth prioritizing.",
  };
}

function buildDiscussionFallbackPlan(
  userRequest: string,
  specialists: TeamExpertRuntimeProfile[],
  hasCjk: boolean
): { tasks: LLMPlannedTask[]; planSummary: string } | null {
  const normalized = String(userRequest ?? "").trim();
  if (!normalized || specialists.length === 0) {
    return null;
  }
  if (!hasDiscussionIntent(normalized) || hasDeliveryIntent(normalized)) {
    return null;
  }
  const picked = specialists.slice(0, Math.min(3, specialists.length));
  if (picked.length === 0) {
    return null;
  }
  return {
    planSummary: hasCjk
      ? "这个请求明显是在要思路和方向，适合先做一轮多专家头脑风暴，而不是先卡在补充细节上。我会让几位专家分别从各自视角提出具体方向、传播机制和主要风险。"
      : "This request is clearly asking for ideas and directions, so it is better to start with a multi-expert brainstorm instead of blocking on clarification. I will have a few specialists contribute concrete angles, spread mechanisms, and key risks.",
    tasks: picked.map((expert) => buildDiscussFallbackTask(expert, hasCjk)),
  };
}

function buildPlannerToolPool(baseTools: AgentToolDef[]): AgentToolDef[] {
  const readOnly = baseTools.filter((tool) => isReadOnlyAgentTool(tool.name));
  const askPlanQuestion = AGENT_TOOLS.find(
    (tool) => tool.name === "ask_plan_question"
  );
  const requestUserInput = AGENT_TOOLS.find(
    (tool) => tool.name === "request_user_input"
  );
  return [
    ...readOnly,
    ...(askPlanQuestion ? [askPlanQuestion] : []),
    ...(requestUserInput ? [requestUserInput] : []),
    teamPlanDecideTool,
  ];
}



function materializePlannedTasks(
  planned: LLMPlannedTask[],
  specialists: TeamExpertRuntimeProfile[],
  existingPendingTasks: TeamTask[] = []
): TeamTask[] {
  const reusableBySignature = new Map<string, TeamTask>();
  for (const task of existingPendingTasks) {
    reusableBySignature.set(buildPlanTaskSignatureFromTask(task), task);
  }

  const prepared = planned.map((plannedTask) => {
    const expert =
      matchExpert(plannedTask.expert, specialists) ?? specialists[0]!;
    const signature = buildPlanTaskSignature(
      expert.assignmentKey,
      plannedTask.task
    );
    const reusable = reusableBySignature.get(signature);
    return {
      expert,
      id: reusable?.id ?? `task-${randomUUID()}`,
      plannedTask,
    };
  });

  const dependencyIdByKey = new Map<string, string>();
  for (const item of prepared) {
    const keys = [
      item.plannedTask.expert,
      item.expert.assignmentKey,
      item.expert.id,
      item.expert.name,
      item.expert.roleType,
    ]
      .map(normalizeTeamTaskKey)
      .filter(Boolean);
    for (const key of keys) {
      if (!dependencyIdByKey.has(key)) {
        dependencyIdByKey.set(key, item.id);
      }
    }
  }

  return prepared.map((item) => ({
    acceptanceCriteria: item.plannedTask.acceptanceCriteria ?? [],
    dependencies: (item.plannedTask.dependencies ?? [])
      .map((value) => dependencyIdByKey.get(normalizeTeamTaskKey(value)) ?? "")
      .filter(Boolean),
    description: item.plannedTask.task,
    expertAssignmentKey: item.expert.assignmentKey,
    expertId: item.expert.id,
    expertName: item.expert.name,
    id: item.id,
    kind: item.plannedTask.kind,
    roleType: item.expert.roleType,
    status: "pending",
  }));
}

function buildDependencyHandoffSection(
  task: TeamTask,
  completedTasksById: Map<string, TeamTask>
): string {
  const items = task.dependencies
    .map((depId) => completedTasksById.get(depId))
    .filter((depTask): depTask is TeamTask => Boolean(depTask))
    .map((depTask) =>
      [
        `### ${depTask.expertName} (${depTask.roleType})`,
        `Status: ${depTask.status}`,
        `Task: ${depTask.description}`,
        "Output:",
        clampTeamPacketText(depTask.result, TEAM_HANDOFF_TEXT_LIMIT),
      ].join("\n")
    );
  return items.length > 0 ? items.join("\n\n") : "None.";
}

function buildFullPlanBreakdown(task: TeamTask, allTasks: TeamTask[]): string {
  if (!allTasks || allTasks.length === 0) {
    return "(no other specialists assigned)";
  }
  return allTasks
    .map((other, index) => {
      const marker = other.id === task.id ? " ← YOU" : "";
      const deps = other.dependencies?.length
        ? ` (depends on: ${other.dependencies
            .map(
              (depId) =>
                allTasks.find((candidate) => candidate.id === depId)
                  ?.expertName ?? depId
            )
            .join(", ")})`
        : "";
      return `${index + 1}. ${other.expertName} (${other.roleType})${marker}${deps}\n   ${other.description}`;
    })
    .join("\n");
}


async function llmPlanTasks(params: {
  settings: ShellSettings;
  threadId: string;
  teamLead: TeamExpertRuntimeProfile;
  specialists: TeamExpertRuntimeProfile[];
  plannerTools: AgentToolDef[];
  messages: ChatMessage[];
  modelSelection: string;
  resolvedModel: TeamOrchestratorInput["resolvedModel"];
  signal: AbortSignal;
  thinkingLevel?: TeamOrchestratorInput["thinkingLevel"];
  workspaceRoot?: string | null;
  extraReadableRoots?: string[];
  workspaceLspManager?: WorkspaceLspManager | null;
  hostWebContentsId?: number | null;
  toolHooks?: ToolExecutionHooks;
  deferredToolState?: DeferredToolState;
  onDeferredToolStateChange?: (state: DeferredToolState) => void;
  toolResultReplacementState?: import("../toolResultBudget.js").ToolResultReplacementState;
  onToolResultReplacementStateChange?: (
    state: import("../toolResultBudget.js").ToolResultReplacementState
  ) => void;
  emit: (evt: TeamEmit) => void;
}): Promise<{
  tasks: LLMPlannedTask[];
  planSummary: string;
  mode: LeadPlanMode;
  clarificationAnswers: string[];
}> {
  const {
    settings,
    threadId,
    teamLead,
    specialists,
    plannerTools,
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
  } = params;
  const hasCjk = messages.some((message) =>
    /[\u3400-\u9fff]/.test(String(message.content ?? ""))
  );
  const effectiveUserRequest =
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content?.trim() ?? "";
  const availableRoles = specialists
    .map(
      (specialist) =>
        `- ${specialist.assignmentKey}: ${specialist.name}${specialist.summary ? ` - ${specialist.summary}` : ""}`
    )
    .join("\n");
  const planMessages: ChatMessage[] = [
    ...messages,
    {
      content: [
        "[SYSTEM] You are the Team Planner coordinating a specialist workflow.",
        "You may inspect the repository with read-only tools before planning, but you must not modify files yourself.",
        "Use read-only investigation to verify assumptions before assigning work.",
        "Use `ask_plan_question` only when a key user decision cannot be discovered from the code or existing context.",
        "Use `request_user_input` when you need 1-3 structured answers instead of a single multiple-choice picker; its tool result is a JSON object keyed by question id.",
        "You MUST call `team_plan_decide` exactly once before the turn ends.",
        "Do NOT put control markers, raw JSON plans, or tool protocol text in your plain-text reply.",
        "",
        "Decision rules (pick the mode that matches the USER INTENT, not just the topic):",
        "- Use mode ANSWER when the user wants a quick, single-voice reply from you (the Lead) — simple questions, chit-chat, or quick clarifications that do NOT benefit from multi-specialist input.",
        '- Use mode CLARIFY when you genuinely cannot tell whether the user wants ideas/discussion or actual implementation, or when a critical routing decision is missing. A good CLARIFY reply asks ONE focused question, for example: "你是想先听几位专家给出不同思路和方案对比，还是希望我们直接开始实现？"',
        "- Use mode PLAN to dispatch specialists. Each task MUST carry a `kind`:",
        '    * `kind: "discuss"` — the specialist shares perspective, analysis, risks, options, or recommendations in text only. They MUST NOT modify files. Use this when the user asked for ideas / 思路 / 想法 / 建议 / 方向 / brainstorm / options / 方案对比 / 讨论, or when they want to hear multiple angles from the team before committing.',
        '    * `kind: "deliver"` — the specialist produces a concrete implementation deliverable (code edits, config, scripts, docs). Use this only when the user explicitly asked to build/implement/ship/write, or when they already accepted a previous discussion round and now want execution.',
        '- NEVER mix discussion intent with deliver-kind tasks. If the user only wants ideas, ALL tasks in this PLAN must be `kind: "discuss"`. Jumping straight to deliver-kind coding on a brainstorming request is the single biggest failure mode — do not do it.',
        "- When mode is ANSWER or CLARIFY, include the final user-visible reply in `replyToUser`.",
        "- When mode is PLAN, include structured tasks in `team_plan_decide.tasks` and keep any plain-text reply as short narrative only.",
        "",
        "Intent signals to watch for:",
        '- Discussion signals (→ PLAN with discuss-kind, or ANSWER): "给我一点思路", "有什么想法", "你觉得", "帮我想想", "方向", "ideas", "brainstorm", "what do you think", "options", "pros and cons", "方案对比".',
        '- Delivery signals (→ PLAN with deliver-kind): "帮我实现", "写一下", "加上", "修一下", "跑一下", "build", "implement", "ship", "fix", "refactor", "add", or a follow-up turn after the user accepted a previous proposal.',
        "- Mixed / ambiguous: prefer CLARIFY or discuss-kind PLAN. Err on the side of NOT writing code.",
        "",
        "Available specialist assignment keys:",
        availableRoles,
        "",
        "If you call `ask_plan_question`, do not repeat the raw options or tool protocol in markdown.",
        "If the user answers an `ask_plan_question`, absorb that answer and continue planning in the same turn whenever possible.",
        "Never invent a generic frontend/backend/qa split just to keep the workflow moving.",
        'For PLAN tasks, include concrete acceptance criteria whenever possible and keep dependencies explicit. For discuss-kind tasks, acceptance criteria should describe what the specialist is expected to OPINE on (e.g., "列出 3 种可行玩法方向并比较优劣"), not what to ship.',
        "Respond in the same language as the user.",
      ].join("\n"),
      role: "user",
    },
  ];

  let planningMessages = planMessages;
  const clarificationAnswers: string[] = [];
  const teamLeadScope = createTeamRoleScope(
    {
      acceptanceCriteria: [],
      dependencies: [],
      description: "Plan the team workflow and assign specialist tasks.",
      expertAssignmentKey: teamLead.assignmentKey,
      expertId: teamLead.id,
      expertName: teamLead.name,
      id: "team-lead",
      kind: "deliver",
      roleType: teamLead.roleType,
      status: "in_progress",
    },
    "lead"
  );
  const options: AgentLoopOptions = {
    maxOutputTokens: resolvedModel.maxOutputTokens,
    modelSelection: teamLead.preferredModelId?.trim() || modelSelection,
    paradigm: resolvedModel.paradigm,
    requestApiKey: resolvedModel.apiKey,
    requestBaseURL: resolvedModel.baseURL,
    requestModelId: resolvedModel.requestModelId,
    requestOAuthAuth: resolvedModel.oauthAuth,
    requestProviderId: resolvedModel.providerId,
    requestProviderIdentity: resolvedModel.providerIdentity,
    requestProxyUrl: resolvedModel.proxyUrl,
    ...(resolvedModel.contextWindowTokens == null
      ? {}
      : { contextWindowTokens: resolvedModel.contextWindowTokens }),
    temperatureMode: resolvedModel.temperatureMode,
    ...(resolvedModel.temperature == null
      ? {}
      : { temperature: resolvedModel.temperature }),
    agentSystemAppend: appendTeamLanguageRule(settings, teamLead.systemPrompt),
    composerMode: "agent",
    deferredToolState,
    extraReadableRoots,
    hostWebContentsId: hostWebContentsId ?? null,
    onDeferredToolStateChange,
    onToolResultReplacementStateChange,
    signal,
    teamToolRoleScope: teamLeadScope,
    thinkingLevel,
    threadId,
    toolHooks,
    toolPoolOverride: plannerTools,
    toolResultReplacementState,
    workspaceLspManager,
    workspaceRoot: workspaceRoot ?? null,
  };

  if (
    teamLead.preferredModelId?.trim() &&
    teamLead.preferredModelId.trim() !== modelSelection
  ) {
    const resolved = resolveModelRequest(
      settings,
      teamLead.preferredModelId.trim()
    );
    if (resolved.ok) {
      options.modelSelection = teamLead.preferredModelId.trim();
      options.requestModelId = resolved.requestModelId;
      options.paradigm = resolved.paradigm;
      options.requestApiKey = resolved.apiKey;
      options.requestBaseURL = resolved.baseURL;
      options.requestProxyUrl = resolved.proxyUrl;
      options.requestProviderId = resolved.providerId;
      options.requestProviderIdentity = resolved.providerIdentity;
      options.requestOAuthAuth = resolved.oauthAuth;
      options.maxOutputTokens = resolved.maxOutputTokens;
      options.contextWindowTokens = resolved.contextWindowTokens;
      options.temperatureMode = resolved.temperatureMode;
      options.temperature = resolved.temperature;
    }
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    let planText = "";
    let visiblePlanText = "";
    const decisionRef: { current: TeamPlanDecision | null } = { current: null };
    const clarificationCountBeforeTurn = clarificationAnswers.length;
    options.customToolHandlers = buildTeamUserInputHandlers({
      agentId: teamLeadScope.teamTaskId,
      agentTitle: teamLeadScope.teamExpertName,
      emit,
      signal,
      teamRoleScope: teamLeadScope,
      threadId,
    });
    const handlers: AgentLoopHandlers = {
      onDone: (text, usage) => {
        planText = text;
        const finalVisible =
          extractTeamLeadNarrative(text) ||
          decisionRef.current?.replyToUser?.trim() ||
          visiblePlanText ||
          (decisionRef.current?.mode === "PLAN"
            ? buildFallbackTeamLeadNarrative(hasCjk)
            : buildClarificationNeededNarrative(hasCjk));
        visiblePlanText = finalVisible;
        emit({
          teamRoleScope: teamLeadScope,
          text: finalVisible,
          threadId,
          type: "done",
          usage,
        });
      },
      onError: () => {},
      onTextDelta: (text) => {
        planText += text;
        const nextVisible = extractTeamLeadNarrative(planText);
        if (!nextVisible || nextVisible === visiblePlanText) {
          return;
        }
        const deltaText = nextVisible.startsWith(visiblePlanText)
          ? nextVisible.slice(visiblePlanText.length)
          : nextVisible;
        visiblePlanText = nextVisible;
        if (deltaText) {
          emit({
            teamRoleScope: teamLeadScope,
            text: deltaText,
            threadId,
            type: "delta",
          });
        }
      },
      onThinkingDelta: (text) => {
        emit({
          teamRoleScope: teamLeadScope,
          text,
          threadId,
          type: "thinking_delta",
        });
      },
      onToolCall: (name, args, toolCallId) => {
        emit({
          args: JSON.stringify(args),
          name,
          teamRoleScope: teamLeadScope,
          threadId,
          toolCallId,
          type: "tool_call",
        });
      },
      onToolInputDelta: ({ name, partialJson, index }) => {
        emit({
          index,
          name,
          partialJson,
          teamRoleScope: teamLeadScope,
          threadId,
          type: "tool_input_delta",
        });
      },
      onToolProgress: ({ name, phase, detail }) => {
        emit({
          detail,
          name,
          phase,
          teamRoleScope: teamLeadScope,
          threadId,
          type: "tool_progress",
        });
      },
      onToolResult: (name, result, success, toolCallId) => {
        if (name === "ask_plan_question" && success) {
          const answer = String(result ?? "").trim();
          if (answer && !clarificationAnswers.includes(answer)) {
            clarificationAnswers.push(answer);
          }
        }
        if (name === "request_user_input" && success) {
          for (const answer of extractRequestUserInputAnswers(
            String(result ?? "")
          )) {
            if (answer && !clarificationAnswers.includes(answer)) {
              clarificationAnswers.push(answer);
            }
          }
        }
        emit({
          name,
          result,
          success,
          teamRoleScope: teamLeadScope,
          threadId,
          toolCallId,
          type: "tool_result",
        });
      },
    };

    setTeamPlanDecideRuntime(teamLeadScope.teamTaskId, {
      onDecision: (nextDecision) => {
        decisionRef.current = nextDecision;
      },
    });
    try {
      await runAgentLoop(settings, planningMessages, options, handlers);
    } finally {
      setTeamPlanDecideRuntime(teamLeadScope.teamTaskId, null);
    }

    const usedClarificationTool =
      clarificationAnswers.length > clarificationCountBeforeTurn;
    const extractedNarrative = extractTeamLeadNarrative(planText);
    const decision = decisionRef.current;

    if (!decision) {
      const fallbackSummary =
        extractedNarrative || buildClarificationNeededNarrative(hasCjk);
      const fallbackDiscussPlan = buildDiscussionFallbackPlan(
        effectiveUserRequest,
        specialists,
        hasCjk
      );
      if (fallbackDiscussPlan && !usedClarificationTool) {
        return {
          clarificationAnswers,
          mode: "PLAN",
          planSummary: fallbackDiscussPlan.planSummary,
          tasks: fallbackDiscussPlan.tasks,
        };
      }
      if (
        plannerTools.some((tool) => tool.name === "ask_plan_question") &&
        !usedClarificationTool &&
        !signal.aborted
      ) {
        const fallbackToolCallId = `team-fallback-clarify-${randomUUID()}`;
        const fallbackArgs = {
          freeform: true,
          options: [
            {
              id: "custom",
              label: hasCjk ? "请补充说明" : "Please add more detail",
            },
          ],
          question: fallbackSummary,
        };
        emit({
          args: JSON.stringify(fallbackArgs),
          name: "ask_plan_question",
          teamRoleScope: teamLeadScope,
          threadId,
          toolCallId: fallbackToolCallId,
          type: "tool_call",
        });
        const fallbackResult = await executeAskPlanQuestionTool(
          {
            arguments: fallbackArgs,
            id: fallbackToolCallId,
            name: "ask_plan_question",
          },
          { teamRoleScope: teamLeadScope }
        );
        emit({
          name: "ask_plan_question",
          result: String(fallbackResult.content ?? ""),
          success: !fallbackResult.isError,
          teamRoleScope: teamLeadScope,
          threadId,
          toolCallId: fallbackToolCallId,
          type: "tool_result",
        });
        const answer = String(fallbackResult.content ?? "").trim();
        if (!fallbackResult.isError && answer) {
          if (!clarificationAnswers.includes(answer)) {
            clarificationAnswers.push(answer);
          }
          planningMessages = appendTeamClarificationMessage(
            planningMessages,
            answer
          );
          continue;
        }
      }
      return {
        clarificationAnswers,
        mode: "CLARIFY",
        planSummary: fallbackSummary,
        tasks: [],
      };
    }

    const planSummary =
      decision.replyToUser?.trim() ||
      extractedNarrative ||
      (decision.mode === "PLAN"
        ? buildFallbackTeamLeadNarrative(hasCjk)
        : buildClarificationNeededNarrative(hasCjk));

    if (decision.mode === "CLARIFY") {
      const fallbackDiscussPlan = buildDiscussionFallbackPlan(
        effectiveUserRequest,
        specialists,
        hasCjk
      );
      if (fallbackDiscussPlan && !usedClarificationTool) {
        return {
          clarificationAnswers,
          mode: "PLAN",
          planSummary: fallbackDiscussPlan.planSummary,
          tasks: fallbackDiscussPlan.tasks,
        };
      }
    }

    if (
      decision.mode === "CLARIFY" &&
      plannerTools.some((tool) => tool.name === "ask_plan_question") &&
      !usedClarificationTool &&
      !signal.aborted
    ) {
      const fallbackToolCallId = `team-fallback-clarify-${randomUUID()}`;
      const fallbackArgs = {
        freeform: true,
        options: [
          {
            id: "custom",
            label: hasCjk ? "请补充说明" : "Please add more detail",
          },
        ],
        question: planSummary || buildClarificationNeededNarrative(hasCjk),
      };
      emit({
        args: JSON.stringify(fallbackArgs),
        name: "ask_plan_question",
        teamRoleScope: teamLeadScope,
        threadId,
        toolCallId: fallbackToolCallId,
        type: "tool_call",
      });
      const fallbackResult = await executeAskPlanQuestionTool(
        {
          arguments: fallbackArgs,
          id: fallbackToolCallId,
          name: "ask_plan_question",
        },
        { teamRoleScope: teamLeadScope }
      );
      emit({
        name: "ask_plan_question",
        result: String(fallbackResult.content ?? ""),
        success: !fallbackResult.isError,
        teamRoleScope: teamLeadScope,
        threadId,
        toolCallId: fallbackToolCallId,
        type: "tool_result",
      });
      const answer = String(fallbackResult.content ?? "").trim();
      if (!fallbackResult.isError && answer) {
        if (!clarificationAnswers.includes(answer)) {
          clarificationAnswers.push(answer);
        }
        planningMessages = appendTeamClarificationMessage(
          planningMessages,
          answer
        );
        continue;
      }
    }

    return {
      clarificationAnswers,
      mode: decision.mode,
      planSummary,
      tasks: decision.mode === "PLAN" ? toLlmPlannedTasks(decision.tasks) : [],
    };
  }

  return {
    clarificationAnswers,
    mode: "CLARIFY",
    planSummary: buildClarificationNeededNarrative(hasCjk),
    tasks: [],
  };
}

function serializeTeamPlanTasks(tasks: TeamTask[]): Array<{
  id: string;
  expertId: string;
  expert: string;
  expertAssignmentKey?: string;
  expertName: string;
  roleType: TeamRoleType;
  task: string;
  dependencies?: string[];
  acceptanceCriteria?: string[];
}> {
  return tasks.map((task) => ({
    acceptanceCriteria: task.acceptanceCriteria,
    dependencies: task.dependencies,
    expert: task.expertAssignmentKey || task.expertId,
    expertAssignmentKey: task.expertAssignmentKey,
    expertId: task.expertId,
    expertName: task.expertName,
    id: task.id,
    roleType: task.roleType,
    task: task.description,
  }));
}

function applyPlanDiff(
  oldPendingTasks: TeamTask[],
  nextPendingTasks: TeamTask[]
): {
  nextPendingTasks: TeamTask[];
  addedTasks: TeamTask[];
  removedTasks: TeamTask[];
  keptTasks: TeamTask[];
} {
  const previousById = new Map(oldPendingTasks.map((task) => [task.id, task]));
  const nextById = new Map(nextPendingTasks.map((task) => [task.id, task]));
  return {
    addedTasks: nextPendingTasks.filter((task) => !previousById.has(task.id)),
    keptTasks: nextPendingTasks.filter((task) => previousById.has(task.id)),
    nextPendingTasks,
    removedTasks: oldPendingTasks.filter((task) => !nextById.has(task.id)),
  };
}

function buildCompletedTaskContext(completedTasks: TeamTask[]): string {
  if (completedTasks.length === 0) {
    return "None.";
  }
  return completedTasks
    .map((task) =>
      [
        `### ${task.expertName} (${task.roleType})`,
        `Task: ${task.description}`,
        `Status: ${task.status}`,
        "Output:",
        clampTeamPacketText(task.result, TEAM_HANDOFF_TEXT_LIMIT),
      ].join("\n")
    )
    .join("\n\n");
}

function appendPlannerReviewRevisionMessage(
  messages: ChatMessage[],
  params: {
    reviewSummary: string;
    completedTasks: TeamTask[];
  }
): ChatMessage[] {
  const { reviewSummary, completedTasks } = params;
  return [
    ...messages,
    {
      content: [
        "[TEAM REVIEW REVISION]",
        "The reviewer reported that the current delivery still needs revision.",
        "",
        "## Reviewer Feedback",
        reviewSummary.trim() || "(none provided)",
        "",
        "## Work Completed So Far",
        buildCompletedTaskContext(completedTasks),
        "",
        "Replan only the work needed to address the review issues.",
        "Preserve already-acceptable work.",
        "If an already completed task must be redone, assign a concrete revision task for it instead of asking for a full restart.",
      ].join("\n"),
      role: "user",
    },
  ];
}

function appendPlannerEscalationMessage(
  messages: ChatMessage[],
  params: {
    task: TeamTask;
    escalation: TeamEscalation;
    completedTasks: TeamTask[];
  }
): ChatMessage[] {
  const { task, escalation, completedTasks } = params;
  return [
    ...messages,
    {
      content: [
        "[TEAM ESCALATION]",
        `${task.expertName} (${task.roleType}) could not safely continue the assigned task.`,
        "",
        "## Escalated Task",
        task.description,
        "",
        "## Reason",
        escalation.reason,
        "",
        "## Proposed Change",
        escalation.proposedChange,
        "",
        "## Blocking Evidence",
        escalation.blockingEvidence.length > 0
          ? escalation.blockingEvidence.map((item) => `- ${item}`).join("\n")
          : "- (none provided)",
        "",
        "## Completed Work So Far",
        buildCompletedTaskContext(completedTasks),
        "",
        "Replan the remaining work. Preserve completed tasks and revise only the unfinished portion.",
      ].join("\n"),
      role: "user",
    },
  ];
}

export {
  matchExpert,
  stripFencedBlocks,
  stripDetailsBlocks,
  stripTrailingRawJson,
  extractTeamLeadNarrative,
  buildFallbackTeamLeadNarrative,
  buildClarificationNeededNarrative,
  hasDiscussionIntent,
  hasDeliveryIntent,
  classifyDiscussFallbackAngle,
  buildDiscussFallbackTask,
  buildDiscussionFallbackPlan,
  buildPlannerToolPool,
  buildTeamUserInputHandlers,
  materializePlannedTasks,
  buildDependencyHandoffSection,
  buildFullPlanBreakdown,
  llmPlanTasks,
  serializeTeamPlanTasks,
  applyPlanDiff,
  buildCompletedTaskContext,
  appendPlannerReviewRevisionMessage,
  appendPlannerEscalationMessage,
};
