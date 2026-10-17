import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { hashAgentAssistantContent } from "../agentFileChangesPersist";
import {
  flattenAssistantTextPartsForSearch,
  isStructuredAssistantMessage,
} from "../agentStructuredMessage";
import {
  extractLatestPlanDraftFromAssistantContent,
  extractLatestPlanDraftFromMessages,
  planDraftToMarkdown,
  planDraftToParsedPlan,
  planDraftToThreadPlan,
} from "../planDraft";
import { planExecutedKey } from "../planExecutedKey";
import {
  generatePlanFilename,
  type ParsedPlan,
  type PlanQuestion,
  parsePlanDocument,
  planBodyWithTodos,
  toPlanMd,
} from "../planParser";
import { useStreaming } from "../streamingStore";

type Message = { role: string; content: string };

function extractPlanTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+Plan:\s*(.+)$/m);
  return match?.[1]?.trim() || null;
}

function extractMarkdownSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^##\\s+${escaped}\\s*$`, "m");
  const idx = markdown.search(regex);
  if (idx < 0) {
    return "";
  }
  const after = markdown.slice(idx).replace(regex, "").trim();
  const next = after.search(/^##\s+/m);
  return (next >= 0 ? after.slice(0, next) : after).trim();
}

function stripMarkdownSection(
  markdown: string,
  headingPattern: string
): string {
  if (!markdown.trim()) {
    return "";
  }
  const regex = new RegExp(
    `^##\\s+(?:${headingPattern})\\s*$[\\s\\S]*?(?=^##\\s+|\\s*$)`,
    "m"
  );
  return markdown
    .replace(regex, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 与下方 `^#\\s+Plan:` 行匹配一致（多行、大小写不敏感）。非结构化流式正文若无此行则不必跑 flatten。 */
export function streamingMayContainAgentPlanHeading(raw: string): boolean {
  if (!raw) {
    return false;
  }
  if (isStructuredAssistantMessage(raw)) {
    return true;
  }
  return /^#\s+plan\s*:/im.test(raw);
}

export function usePlanSystem(
  shell: NonNullable<Window["maiShell"]> | undefined,
  currentId: string | null,
  currentIdRef: RefObject<string | null>,
  messages: Message[],
  messagesThreadId: string | null,
  messagesRef: RefObject<Message[]>,
  workspace: string | null,
  defaultModel: string
) {
  // streaming 从外部 store 订阅，避免 App 顶层需要把 streaming 作为参数传入
  const streaming = useStreaming();
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [planFilePath, setPlanFilePath] = useState<string | null>(null);
  const [planFileRelPath, setPlanFileRelPath] = useState<string | null>(null);
  const [executedPlanKeys, setExecutedPlanKeys] = useState<string[]>([]);
  const [planQuestion, setPlanQuestion] = useState<PlanQuestion | null>(null);
  const [planQuestionRequestId, setPlanQuestionRequestId] = useState<
    string | null
  >(null);
  const planQuestionDismissedByThreadRef = useRef(new Map<string, string>());
  const [agentPlanBuildModelId, setAgentPlanBuildModelId] = useState("");
  const [editorPlanBuildModelId, setEditorPlanBuildModelId] = useState("");
  const [editorPlanReviewDismissed, setEditorPlanReviewDismissed] =
    useState(false);
  const [planTodoDraftOpen, setPlanTodoDraftOpen] = useState(false);
  const [planTodoDraftText, setPlanTodoDraftText] = useState("");
  const planTodoDraftInputRef = useRef<HTMLInputElement | null>(null);
  const planBuildPendingMarkerRef = useRef<{
    threadId: string;
    pathKey: string;
  } | null>(null);

  // ── Derived plan state ──
  const latestPersistedPlanDraft = useMemo(
    () =>
      currentId && messagesThreadId === currentId
        ? extractLatestPlanDraftFromMessages(messages)
        : null,
    [currentId, messagesThreadId, messages]
  );

  const latestPersistedAgentPlanMarkdown = useMemo(() => {
    if (latestPersistedPlanDraft) {
      return planDraftToMarkdown(latestPersistedPlanDraft);
    }
    if (!currentId || messagesThreadId !== currentId) {
      return "";
    }
    const msgs = messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m?.role !== "assistant") continue;
      const flattened = flattenAssistantTextPartsForSearch(m.content);
      const heading = flattened.match(/^#\s+Plan:\s*.+$/m);
      if (heading && heading.index !== undefined) {
        return flattened.slice(heading.index).trim();
      }
    }
    return "";
  }, [currentId, messagesThreadId, messages, latestPersistedPlanDraft]);

  const streamingPlanDraft = useMemo(
    () => extractLatestPlanDraftFromAssistantContent(streaming),
    [streaming]
  );

  const agentPlanPreviewMarkdown = useMemo(() => {
    if (parsedPlan) return planBodyWithTodos(parsedPlan);
    if (streamingPlanDraft) {
      return planDraftToMarkdown(streamingPlanDraft);
    }
    if (!streamingMayContainAgentPlanHeading(streaming)) {
      return latestPersistedAgentPlanMarkdown;
    }
    const streamingText = flattenAssistantTextPartsForSearch(streaming);
    const heading = streamingText.match(/^#\s+Plan:\s*.+$/m);
    const streamingPreview =
      heading && heading.index !== undefined
        ? streamingText.slice(heading.index).trim()
        : "";
    return streamingPreview || latestPersistedAgentPlanMarkdown;
  }, [
    parsedPlan,
    streaming,
    latestPersistedAgentPlanMarkdown,
    streamingPlanDraft,
  ]);

  const agentPlanEffectivePlan = useMemo(
    () =>
      parsedPlan ??
      (streamingPlanDraft
        ? planDraftToParsedPlan(streamingPlanDraft)
        : latestPersistedPlanDraft
          ? planDraftToParsedPlan(latestPersistedPlanDraft)
          : agentPlanPreviewMarkdown
            ? parsePlanDocument(agentPlanPreviewMarkdown)
            : null),
    [
      parsedPlan,
      agentPlanPreviewMarkdown,
      streamingPlanDraft,
      latestPersistedPlanDraft,
    ]
  );

  const agentPlanPreviewTitle = useMemo(
    () =>
      agentPlanEffectivePlan?.name ??
      extractPlanTitle(agentPlanPreviewMarkdown),
    [agentPlanEffectivePlan, agentPlanPreviewMarkdown]
  );

  const agentPlanDocumentMarkdown = useMemo(() => {
    if (!agentPlanPreviewMarkdown) {
      return "";
    }
    const stripped = stripMarkdownSection(
      agentPlanPreviewMarkdown,
      "To-dos|Todos|TODOs?"
    );
    return stripped || agentPlanPreviewMarkdown;
  }, [agentPlanPreviewMarkdown]);

  const agentPlanGoalMarkdown = useMemo(() => {
    if (!agentPlanPreviewMarkdown) {
      return "";
    }
    return extractMarkdownSection(agentPlanPreviewMarkdown, "Goal").trim();
  }, [agentPlanPreviewMarkdown]);

  const agentPlanTodos = useMemo(
    () => agentPlanEffectivePlan?.todos ?? [],
    [agentPlanEffectivePlan]
  );
  const agentPlanTodoDoneCount = useMemo(
    () => agentPlanTodos.filter((t) => t.status === "completed").length,
    [agentPlanTodos]
  );
  const agentPlanGoalSummary = useMemo(() => {
    if (!agentPlanGoalMarkdown) {
      return "";
    }
    return agentPlanGoalMarkdown.split("\n")[0]?.trim() ?? "";
  }, [agentPlanGoalMarkdown]);

  const hasAgentPlanSidebarContent = Boolean(agentPlanPreviewMarkdown.trim());

  // ── Callbacks ──
  const getLatestAgentPlan = useCallback((): ParsedPlan | null => {
    if (parsedPlan) return parsedPlan;
    const draftFromStreaming =
      extractLatestPlanDraftFromAssistantContent(streaming);
    if (draftFromStreaming) {
      return planDraftToParsedPlan(draftFromStreaming);
    }
    if (streamingMayContainAgentPlanHeading(streaming)) {
      const streamingText = flattenAssistantTextPartsForSearch(streaming);
      const heading = streamingText.match(/^#\s+Plan:\s*.+$/m);
      if (heading && heading.index !== undefined) {
        return parsePlanDocument(streamingText.slice(heading.index).trim());
      }
    }
    const draftFromMessages = extractLatestPlanDraftFromMessages(
      messagesRef.current
    );
    if (draftFromMessages) {
      return planDraftToParsedPlan(draftFromMessages);
    }
    const msgs = messagesRef.current;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m?.role !== "assistant") continue;
      const flat = flattenAssistantTextPartsForSearch(m.content);
      const h = flat.match(/^#\s+Plan:\s*.+$/m);
      if (h && h.index !== undefined) {
        return parsePlanDocument(flat.slice(h.index).trim());
      }
    }
    return null;
  }, [parsedPlan, streaming]);

  const planToStructuredDraft = useCallback(
    (plan: ParsedPlan) =>
      planDraftToThreadPlan(
        {
          executionOverview: [],
          filesToChange: [],
          goal: plan.overview,
          implementationSteps: plan.todos.map((todo) => ({
            description: todo.content,
            title: todo.content.split(":")[0]?.trim() ?? todo.content,
          })),
          openQuestions: [],
          risksAndEdgeCases: [],
          scopeContext: [],
          title: plan.name,
          todos: plan.todos.map((todo) => ({
            content: todo.content,
            id: todo.id,
            status: todo.status,
          })),
        },
        { path: planFilePath, relPath: planFileRelPath }
      ),
    [planFilePath, planFileRelPath]
  );

  const persistPlanDraft = useCallback(
    async (plan: ParsedPlan) => {
      if (!shell) return;
      try {
        const content = toPlanMd(plan);
        if (planFileRelPath || planFilePath) {
          await shell.invoke(
            "fs:writeFile",
            planFileRelPath ?? planFilePath ?? "",
            content
          );
        } else {
          const filename = generatePlanFilename(plan.name);
          const r = (await shell.invoke("plan:save", { content, filename })) as
            | { ok: true; path: string; relPath?: string }
            | { ok: false; error?: string };
          if (r.ok) {
            setPlanFilePath(r.path);
            setPlanFileRelPath(r.relPath ?? null);
          }
        }
        const threadId = currentIdRef.current;
        if (threadId) {
          await shell.invoke("plan:saveStructured", {
            plan: planToStructuredDraft(plan),
            threadId,
          });
        }
      } catch (error) {
        console.error("[plan:draftPersist]", error);
      }
    },
    [shell, planFileRelPath, planFilePath, planToStructuredDraft]
  );

  const updatePlanDraft = useCallback(
    (mutator: (plan: ParsedPlan) => ParsedPlan | null) => {
      const basePlan = getLatestAgentPlan();
      if (!basePlan) return null;
      const nextPlan = mutator(basePlan);
      if (!nextPlan) return null;
      setParsedPlan(nextPlan);
      void persistPlanDraft(nextPlan);
      return nextPlan;
    },
    [getLatestAgentPlan, persistPlanDraft]
  );

  const onPlanTodoToggle = useCallback(
    (id: string) => {
      updatePlanDraft((basePlan) => ({
        ...basePlan,
        todos: basePlan.todos.map((t) =>
          t.id === id
            ? {
                ...t,
                status:
                  t.status === "completed"
                    ? ("pending" as const)
                    : ("completed" as const),
              }
            : t
        ),
      }));
    },
    [updatePlanDraft]
  );

  const onPlanAddTodo = useCallback(() => {
    if (!getLatestAgentPlan()) return;
    setPlanTodoDraftOpen(true);
    setPlanTodoDraftText("");
  }, [getLatestAgentPlan]);

  const onPlanAddTodoCancel = useCallback(() => {
    setPlanTodoDraftOpen(false);
    setPlanTodoDraftText("");
  }, []);

  const onPlanAddTodoSubmit = useCallback(() => {
    const nextText = planTodoDraftText.trim();
    if (!nextText) return;
    updatePlanDraft((currentPlan) => ({
      ...currentPlan,
      todos: [
        ...currentPlan.todos,
        {
          content: nextText,
          id: `todo-${currentPlan.todos.length + 1}`,
          status: "pending",
        },
      ],
    }));
    setPlanTodoDraftOpen(false);
    setPlanTodoDraftText("");
  }, [planTodoDraftText, updatePlanDraft]);

  const onPlanQuestionSkip = useCallback(() => {
    const id = currentIdRef.current;
    const msgs = messagesRef.current;
    const last = [...msgs].reverse().find((m) => m.role === "assistant");
    if (id && last) {
      planQuestionDismissedByThreadRef.current.set(
        id,
        hashAgentAssistantContent(last.content)
      );
    }
  }, []);

  const planReviewPathKeyMemo = useMemo(
    () => planExecutedKey(workspace, planFileRelPath, planFilePath),
    [workspace, planFileRelPath, planFilePath]
  );

  const planReviewIsBuilt = useMemo(
    () =>
      Boolean(
        planReviewPathKeyMemo &&
          executedPlanKeys.includes(planReviewPathKeyMemo)
      ),
    [planReviewPathKeyMemo, executedPlanKeys]
  );

  // ── Effects ──
  useEffect(() => {
    if (!shell || !currentId) {
      setExecutedPlanKeys([]);
      return;
    }
    let cancelled = false;
    void shell.invoke("threads:getExecutedPlanKeys", currentId).then((r) => {
      if (cancelled) return;
      const rec = r as { ok?: boolean; keys?: string[] };
      setExecutedPlanKeys(rec.ok && Array.isArray(rec.keys) ? rec.keys : []);
    });
    return () => {
      cancelled = true;
    };
  }, [shell, currentId]);

  useEffect(() => {
    if (!shell || !currentId) {
      setPlanFilePath(null);
      setPlanFileRelPath(null);
      return;
    }
    let cancelled = false;
    void shell.invoke("threads:getPlan", currentId).then((response) => {
      if (cancelled) {
        return;
      }
      const result = response as {
        ok?: boolean;
        plan?: {
          sourcePath?: string | null;
          sourceRelPath?: string | null;
        } | null;
      };
      setPlanFilePath(result.ok ? (result.plan?.sourcePath ?? null) : null);
      setPlanFileRelPath(
        result.ok ? (result.plan?.sourceRelPath ?? null) : null
      );
    });
    return () => {
      cancelled = true;
    };
  }, [shell, currentId]);

  useEffect(() => {
    if (!defaultModel.trim()) return;
    setAgentPlanBuildModelId((prev) => (prev.trim() ? prev : defaultModel));
  }, [defaultModel, parsedPlan, agentPlanPreviewMarkdown]);

  useEffect(() => {
    if (!agentPlanEffectivePlan) {
      setPlanTodoDraftOpen(false);
      setPlanTodoDraftText("");
    }
  }, [agentPlanEffectivePlan]);

  useEffect(() => {
    if (!planTodoDraftOpen) return;
    const id = window.requestAnimationFrame(() => {
      planTodoDraftInputRef.current?.focus();
      planTodoDraftInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [planTodoDraftOpen]);

  const resetPlanState = useCallback(() => {
    setParsedPlan(null);
    setPlanFilePath(null);
    setPlanFileRelPath(null);
    setExecutedPlanKeys([]);
    setPlanQuestion(null);
    setPlanQuestionRequestId(null);
    planBuildPendingMarkerRef.current = null;
  }, []);

  return {
    agentPlanBuildModelId,
    agentPlanDocumentMarkdown,
    agentPlanEffectivePlan,
    agentPlanGoalMarkdown,
    agentPlanGoalSummary,
    agentPlanPreviewMarkdown,
    agentPlanPreviewTitle,
    agentPlanTodoDoneCount,
    agentPlanTodos,
    editorPlanBuildModelId,
    editorPlanReviewDismissed,
    executedPlanKeys,
    // Callbacks
    getLatestAgentPlan,
    hasAgentPlanSidebarContent,
    // Derived
    latestPersistedAgentPlanMarkdown,
    onPlanAddTodo,
    onPlanAddTodoCancel,
    onPlanAddTodoSubmit,
    onPlanQuestionSkip,
    onPlanTodoToggle,
    // State
    parsedPlan,
    persistPlanDraft,
    planBuildPendingMarkerRef,
    planFilePath,
    planFileRelPath,
    planQuestion,
    planQuestionDismissedByThreadRef,
    planQuestionRequestId,
    planReviewIsBuilt,
    planReviewPathKeyMemo,
    planTodoDraftInputRef,
    planTodoDraftOpen,
    planTodoDraftText,
    planToStructuredDraft,
    resetPlanState,
    setAgentPlanBuildModelId,
    setEditorPlanBuildModelId,
    setEditorPlanReviewDismissed,
    setExecutedPlanKeys,
    setParsedPlan,
    setPlanFilePath,
    setPlanFileRelPath,
    setPlanQuestion,
    setPlanQuestionRequestId,
    setPlanTodoDraftOpen,
    setPlanTodoDraftText,
    updatePlanDraft,
  };
}
