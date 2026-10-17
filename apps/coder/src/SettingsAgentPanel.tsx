import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  AgentCommand,
  AgentCustomization,
  AgentItemOrigin,
  AgentMemoryScope,
  AgentRule,
  AgentRuleScope,
  AgentSkill,
  AgentSubagent,
} from "./agentSettingsTypes";
import {
  defaultAgentCustomization,
  isAnyDiskImportedSkill,
  isGlobalDiskImportedSkill,
  isPluginImportedCommand,
  isPluginImportedSkill,
  isWorkspaceDiskImportedSkill,
} from "./agentSettingsTypes";
import { createAutoReplyLanguageRule } from "./autoReplyLanguageRule";
import { buildSlashCommandListRows } from "./composerSlashCommands";
import type { AppLocale } from "./i18n";
import { useI18n } from "./i18n";
import { VoidSelect } from "./VoidSelect";

/** Skill 快速模板 */
export type SkillTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
};

export const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    content: `## Review Pull Request

1. Read the PR description and linked issues
2. Run git diff to see all changes
3. For each changed file:
   - Check code style and formatting
   - Look for potential bugs or edge cases
   - Verify test coverage
   - Check for security issues
4. Provide a summary with:
   - Overall assessment (approve / request changes / comment)
   - Key findings (positive and negative)
   - Specific suggestions with line references
   - Action items for the author`,
    description:
      "Review a pull request by analyzing diff, checking style, and providing feedback.",
    id: "review-pr",
    name: "Review PR",
    slug: "review-pr",
  },
  {
    content: `## Write Tests

1. Read the target file(s) to understand the code
2. Identify the public API surface (functions, classes, methods)
3. For each public unit:
   - Write happy path tests
   - Write edge case tests (null, empty, boundary values)
   - Write error case tests (exceptions, invalid inputs)
4. Use the existing test framework and conventions in the project
5. Ensure tests are independent and can run in any order
6. Add descriptive test names that explain the scenario`,
    description:
      "Generate comprehensive test cases for the given code or feature.",
    id: "write-tests",
    name: "Write Tests",
    slug: "write-tests",
  },
  {
    content: `## Refactor Code

1. Read the target file(s) carefully
2. Identify code smells:
   - Long functions / classes
   - Duplicate code
   - Deep nesting
   - Magic numbers / strings
   - Tight coupling
3. Apply appropriate refactorings:
   - Extract functions / methods
   - Rename for clarity
   - Simplify conditionals
   - Remove dead code
4. Ensure all existing tests still pass
5. Do NOT change behavior — only structure`,
    description:
      "Refactor code to improve readability, performance, and maintainability.",
    id: "refactor",
    name: "Refactor",
    slug: "refactor",
  },
  {
    content: `## Generate Commit Message

1. Run git diff --staged to see the changes
2. Analyze the scope and intent of the changes
3. Write a commit message following conventional commits format:
   - type(scope): subject
   - Optional body explaining why and how
   - Optional footer for breaking changes or issue references
4. Types: feat, fix, docs, style, refactor, test, chore, perf, ci
5. Keep the subject line under 72 characters
6. Use imperative mood in the subject`,
    description: "Generate a conventional commit message from staged changes.",
    id: "commit-message",
    name: "Commit Message",
    slug: "commit",
  },
];

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconDrag({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <circle cx="9" cy="6" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="15" cy="6" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="9" cy="12" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="15" cy="12" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="9" cy="18" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="15" cy="18" fill="currentColor" r="1.5" stroke="none" />
    </svg>
  );
}

function IconChevDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="12"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="12"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}

function BadgeLike({ text }: { text: string }) {
  return <span className="ref-settings-plugins-badge">{text}</span>;
}

const SLASH_HELP_COLLAPSED_ITEMS = 8;

/** Generic drag-to-reorder for a list of {id} items */
function useDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (next: T[]) => void
) {
  const [dragId, setDragId] = useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const fromIdx = items.findIndex((x) => x.id === dragId);
    const toIdx = items.findIndex((x) => x.id === targetId);
    if (fromIdx < 0 || toIdx < 0) {
      setDragId(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved!);
    onReorder(next);
    setDragId(null);
  };

  const onDragEnd = () => setDragId(null);

  return { dragId, onDragEnd, onDragOver, onDragStart, onDrop };
}

type AgentLibraryFilter = "all" | "user" | "project";

type Props = {
  value: AgentCustomization;
  onChange: (next: AgentCustomization) => void;
  locale: AppLocale;
  workspaceOpen: boolean;
  /** 新建 Skill：打开对话并由模型引导编写 SKILL.md */
  onOpenSkillCreator?: () => void | Promise<void>;
  /** 点击磁盘技能卡片时在编辑器中打开 SKILL.md */
  onOpenWorkspaceSkillFile?: (relPath: string) => void | Promise<void>;
  /** 删除磁盘技能目录（整夹）；返回是否成功 */
  onDeleteWorkspaceSkillDisk?: (skillMdRelPath: string) => Promise<boolean>;
  /** 重新扫描磁盘技能 */
  onRefreshDiskSkills?: () => void;
};

function itemMatchesLibraryFilter(
  item: { origin?: AgentItemOrigin },
  filter: AgentLibraryFilter
): boolean {
  const o = item.origin ?? "user";
  if (filter === "all") return true;
  if (filter === "user") return o === "user";
  return o === "project";
}

export function SettingsAgentPanel({
  value,
  onChange,
  locale,
  workspaceOpen,
  onOpenSkillCreator,
  onOpenWorkspaceSkillFile,
  onDeleteWorkspaceSkillDisk,
  onRefreshDiskSkills,
}: Props) {
  const { t } = useI18n();
  const v = { ...defaultAgentCustomization(), ...value };
  const rules = v.rules ?? [];
  const skills = v.skills ?? [];
  const subagents = v.subagents ?? [];
  const commands = v.commands ?? [];
  const autoReplyLanguageRule = useMemo(
    () => createAutoReplyLanguageRule(locale, locale),
    [locale]
  );

  const [libraryFilter, setLibraryFilter] = useState<AgentLibraryFilter>("all");
  const reorderEnabled = libraryFilter === "all";

  const originForNewItem = (): AgentItemOrigin => {
    if (libraryFilter === "project") return "project";
    return "user";
  };

  const canAddProjectItem = libraryFilter !== "project" || workspaceOpen;

  /** 折叠状态 */
  const [collapsedRules, setCollapsedRules] = useState<Set<string>>(new Set());
  const [collapsedSkills, setCollapsedSkills] = useState<Set<string>>(
    new Set()
  );
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set());
  const [collapsedCmds, setCollapsedCmds] = useState<Set<string>>(new Set());
  const [diskSkillDeletingId, setDiskSkillDeletingId] = useState<string | null>(
    null
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const toggleCollapse = (
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setter(next);
  };

  const patch = useCallback(
    (p: Partial<AgentCustomization>) => {
      onChange({ ...v, ...p });
    },
    [v, onChange]
  );

  // ─── Rules ────────────────────────────────────────────
  const addRule = () => {
    if (!canAddProjectItem) return;
    const r: AgentRule = {
      content: "",
      enabled: true,
      id: newId(),
      name: "新规则",
      origin: originForNewItem(),
      scope: "always",
    };
    patch({ rules: [...rules, r] });
  };
  const updateRule = (id: string, p: Partial<AgentRule>) => {
    patch({ rules: rules.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  };
  const removeRule = (id: string) => {
    patch({ rules: rules.filter((x) => x.id !== id) });
  };
  const rulesDrag = useDragReorder(rules, (next) => patch({ rules: next }));

  // ─── Skills ───────────────────────────────────────────
  const updateSkill = (id: string, p: Partial<AgentSkill>) => {
    const cur = skills.find((x) => x.id === id);
    if (
      cur &&
      (isWorkspaceDiskImportedSkill(cur) || isPluginImportedSkill(cur))
    )
      return;
    const nextEditable = editableSkills.map((x) =>
      x.id === id ? { ...x, ...p } : x
    );
    patch({ skills: [...pluginSkills, ...diskSkillsAll, ...nextEditable] });
  };
  const removeSkill = (id: string) => {
    const cur = skills.find((x) => x.id === id);
    if (
      cur &&
      (isWorkspaceDiskImportedSkill(cur) || isPluginImportedSkill(cur))
    )
      return;
    patch({
      skills: [
        ...pluginSkills,
        ...diskSkillsAll,
        ...editableSkills.filter((x) => x.id !== id),
      ],
    });
  };

  const pluginSkills = skills.filter((s) => isPluginImportedSkill(s));
  const diskSkillsAll = skills.filter((s) => isAnyDiskImportedSkill(s));
  const editableSkills = skills.filter(
    (s) => !isAnyDiskImportedSkill(s) && !isPluginImportedSkill(s)
  );
  const skillsDrag = useDragReorder(editableSkills, (nextEditable) =>
    patch({ skills: [...pluginSkills, ...diskSkillsAll, ...nextEditable] })
  );

  const toggleDiskSkill = (s: AgentSkill) => {
    const overrides = { ...(v.diskSkillEnabledOverrides ?? {}) };
    const slug = s.slug.trim().toLowerCase();
    const current = s.enabled !== false;
    overrides[slug] = !current;
    patch({ diskSkillEnabledOverrides: overrides });
  };

  const addSkillFromTemplate = (template: SkillTemplate) => {
    const id = newId();
    const s: AgentSkill = {
      content: template.content,
      description: template.description,
      enabled: true,
      id,
      name: template.name,
      origin: originForNewItem(),
      slug: template.slug,
    };
    patch({ skills: [...skills, s] });
  };

  const importSkillFromMarkdown = (markdown: string) => {
    const trimmed = markdown.trim();
    if (!trimmed.startsWith("---")) return false;
    const end = trimmed.indexOf("\n---", 3);
    if (end < 0) return false;
    const yaml = trimmed.slice(3, end).trim();
    const body = trimmed.slice(end + 4).trim();
    const meta: Record<string, string> = {};
    for (const line of yaml.split("\n")) {
      const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (m) meta[m[1]] = (m[2] ?? "").replace(/^["']|["']$/g, "").trim();
    }
    const slug = (meta.slug ?? meta.name ?? "unnamed")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) return false;
    const s: AgentSkill = {
      content: body,
      description: meta.description || "",
      enabled: true,
      id: newId(),
      name: meta.name || slug,
      origin: originForNewItem(),
      slug,
    };
    patch({ skills: [...skills, s] });
    return true;
  };

  const deleteDiskSkill = async (s: AgentSkill) => {
    const rel = s.skillSourceRelPath;
    if (!rel || !onDeleteWorkspaceSkillDisk) return;
    if (
      !window.confirm(t("agentSettings.skillDiskDeleteConfirm", { path: rel }))
    )
      return;
    setDiskSkillDeletingId(s.id);
    try {
      const ok = await onDeleteWorkspaceSkillDisk(rel);
      if (!ok) window.alert(t("agentSettings.skillDiskDeleteFailed"));
    } finally {
      setDiskSkillDeletingId(null);
    }
  };

  const onDiskCardOpenClick = (rel: string) => {
    if (onOpenWorkspaceSkillFile) void onOpenWorkspaceSkillFile(rel);
  };

  // ─── Subagents ────────────────────────────────────────
  const addSub = () => {
    if (!canAddProjectItem) return;
    const s: AgentSubagent = {
      description: "",
      enabled: true,
      id: newId(),
      instructions: "",
      name: "新 Subagent",
      origin: originForNewItem(),
    };
    patch({ subagents: [...subagents, s] });
  };
  const updateSub = (id: string, p: Partial<AgentSubagent>) => {
    patch({
      subagents: subagents.map((x) => (x.id === id ? { ...x, ...p } : x)),
    });
  };
  const removeSub = (id: string) => {
    patch({ subagents: subagents.filter((x) => x.id !== id) });
  };
  const subsDrag = useDragReorder(subagents, (next) =>
    patch({ subagents: next })
  );
  const subagentMemoryOptions: Array<{
    value: AgentMemoryScope | "none";
    label: string;
  }> = [
    { label: t("agentSettings.subMemoryNone"), value: "none" },
    { label: t("agentSettings.subMemoryUser"), value: "user" },
    { label: t("agentSettings.subMemoryProject"), value: "project" },
    { label: t("agentSettings.subMemoryLocal"), value: "local" },
  ];
  const getSubagentMemoryLabel = (scope?: AgentMemoryScope): string | null => {
    if (!scope) return null;
    return (
      subagentMemoryOptions.find((opt) => opt.value === scope)?.label ?? scope
    );
  };

  // ─── Commands ─────────────────────────────────────────
  const pluginCommands = commands.filter((command) =>
    isPluginImportedCommand(command)
  );
  const editableCommands = commands.filter(
    (command) => !isPluginImportedCommand(command)
  );
  const addCmd = () => {
    const c: AgentCommand = {
      body: "{{args}}",
      description: "",
      id: newId(),
      name: "新命令",
      slash: "cmd",
    };
    patch({ commands: [...editableCommands, c, ...pluginCommands] });
  };
  const updateCmd = (id: string, p: Partial<AgentCommand>) => {
    patch({
      commands: [
        ...editableCommands.map((x) => (x.id === id ? { ...x, ...p } : x)),
        ...pluginCommands,
      ],
    });
  };
  const removeCmd = (id: string) => {
    patch({
      commands: [
        ...editableCommands.filter((x) => x.id !== id),
        ...pluginCommands,
      ],
    });
  };
  const cmdsDrag = useDragReorder(editableCommands, (next) =>
    patch({ commands: [...next, ...pluginCommands] })
  );
  const slashCmdHelpRows = useMemo(
    () => buildSlashCommandListRows(commands, t),
    [commands, t]
  );
  const [slashHelpExpanded, setSlashHelpExpanded] = useState(false);
  const slashHelpListRef = useRef<HTMLUListElement | null>(null);
  const [slashHelpHeights, setSlashHelpHeights] = useState({
    collapsed: 0,
    expanded: 0,
  });
  const shouldCollapseSlashHelp =
    slashCmdHelpRows.length > SLASH_HELP_COLLAPSED_ITEMS;

  useLayoutEffect(() => {
    if (!shouldCollapseSlashHelp && slashHelpExpanded) {
      setSlashHelpExpanded(false);
    }
  }, [shouldCollapseSlashHelp, slashHelpExpanded]);

  useLayoutEffect(() => {
    const listEl = slashHelpListRef.current;
    if (!listEl) {
      return;
    }

    let frame = 0;
    const measure = () => {
      const items = Array.from(listEl.children) as HTMLElement[];
      const expanded = Math.ceil(listEl.scrollHeight);
      let collapsed = expanded;
      if (shouldCollapseSlashHelp && items.length > 0) {
        const lastVisibleIndex =
          Math.min(SLASH_HELP_COLLAPSED_ITEMS, items.length) - 1;
        const lastVisibleItem = items[lastVisibleIndex];
        if (lastVisibleItem) {
          collapsed = Math.ceil(
            lastVisibleItem.offsetTop + lastVisibleItem.offsetHeight
          );
        }
      }
      setSlashHelpHeights((prev) =>
        prev.collapsed === collapsed && prev.expanded === expanded
          ? prev
          : { collapsed, expanded }
      );
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleMeasure);
    resizeObserver?.observe(listEl);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [shouldCollapseSlashHelp, slashCmdHelpRows]);

  const slashHelpVisibleHeight =
    shouldCollapseSlashHelp && slashHelpHeights.expanded > 0
      ? slashHelpExpanded
        ? slashHelpHeights.expanded
        : slashHelpHeights.collapsed
      : null;
  const hiddenSlashCount = Math.max(
    0,
    slashCmdHelpRows.length - SLASH_HELP_COLLAPSED_ITEMS
  );

  const renderOriginBadge = (origin?: AgentItemOrigin) => {
    const o = origin ?? "user";
    return (
      <span
        className={`ref-settings-agent-origin-badge ${o === "project" ? "ref-settings-agent-origin-badge--project" : "ref-settings-agent-origin-badge--user"}`}
      >
        {o === "project"
          ? t("agentSettings.originProject")
          : t("agentSettings.originUser")}
      </span>
    );
  };

  return (
    <div className="ref-settings-panel ref-settings-panel--agent">
      <p className="ref-settings-lead ref-settings-agent-lead">
        {t("agentSettings.leadCursor")}
      </p>
      <div
        aria-label={t("agentSettings.scopeFilterAria")}
        className="ref-settings-agent-scope-pills"
        role="tablist"
      >
        {(["all", "user", "project"] as const).map((key) => (
          <button
            aria-selected={libraryFilter === key}
            className={`ref-settings-agent-scope-pill ${libraryFilter === key ? "is-active" : ""}`}
            key={key}
            onClick={() => setLibraryFilter(key)}
            role="tab"
            type="button"
          >
            {key === "all" ? t("agentSettings.scopeFilterAll") : null}
            {key === "user" ? t("agentSettings.scopeFilterUser") : null}
            {key === "project" ? t("agentSettings.scopeFilterProject") : null}
          </button>
        ))}
      </div>

      {/* ─── Rules ─── */}
      <section
        aria-labelledby="agent-rules-h"
        className="ref-settings-agent-section"
      >
        <div className="ref-settings-agent-section-head">
          <h2 className="ref-settings-agent-section-title" id="agent-rules-h">
            {t("agentSettings.rulesTitle")}
            <span
              className="ref-settings-agent-info-ico"
              title={t("agentSettings.rulesInfo")}
            >
              <IconInfo />
            </span>
          </h2>
          <button
            className="ref-settings-agent-new-btn"
            disabled={!canAddProjectItem}
            onClick={addRule}
            title={
              canAddProjectItem
                ? undefined
                : t("agentSettings.needWorkspaceForProject")
            }
            type="button"
          >
            + {t("agentSettings.new")}
          </button>
        </div>
        <p className="ref-settings-agent-section-desc">
          {t("agentSettings.rulesDesc")}
        </p>
        {libraryFilter === "project" ? null : (
          <ul className="ref-settings-agent-list">
            <li className="ref-settings-agent-item">
              <div className="ref-settings-agent-item-head">
                <span aria-hidden className="ref-settings-agent-drag-handle">
                  <IconDrag />
                </span>
                <button
                  aria-checked="true"
                  className="ref-settings-toggle ref-settings-toggle--sm is-on"
                  disabled
                  role="switch"
                  title={t("agentSettings.autoLanguageRuleBadge")}
                  type="button"
                >
                  <span className="ref-settings-toggle-knob" />
                </button>
                <span className="ref-settings-agent-origin-badge ref-settings-agent-origin-badge--user">
                  {t("agentSettings.autoLanguageRuleBadge")}
                </span>
                <input
                  aria-label={t("agentSettings.ruleNameAria")}
                  className="ref-settings-agent-item-name"
                  readOnly
                  value={autoReplyLanguageRule.name}
                />
              </div>
              <div className="ref-settings-field ref-settings-field--compact">
                <p className="ref-settings-proxy-hint ref-settings-field-footnote">
                  {t("agentSettings.autoLanguageRuleHint")}
                </p>
              </div>
              <label className="ref-settings-field ref-settings-field--compact">
                <span>{t("agentSettings.ruleBody")}</span>
                <textarea
                  readOnly
                  rows={3}
                  value={autoReplyLanguageRule.content}
                />
              </label>
            </li>
          </ul>
        )}
        <ul className="ref-settings-agent-list">
          {rules
            .filter((r) => itemMatchesLibraryFilter(r, libraryFilter))
            .map((r) => {
              const collapsed = collapsedRules.has(r.id);
              return (
                <li
                  className={`ref-settings-agent-item ${rulesDrag.dragId === r.id ? "is-dragging" : ""}`}
                  draggable={reorderEnabled}
                  key={r.id}
                  onDragEnd={rulesDrag.onDragEnd}
                  onDragOver={rulesDrag.onDragOver}
                  onDragStart={(e) => rulesDrag.onDragStart(e, r.id)}
                  onDrop={(e) => rulesDrag.onDrop(e, r.id)}
                >
                  <div className="ref-settings-agent-item-head">
                    <span
                      aria-hidden
                      className="ref-settings-agent-drag-handle"
                    >
                      <IconDrag />
                    </span>
                    <button
                      aria-checked={r.enabled}
                      className={`ref-settings-toggle ref-settings-toggle--sm ${r.enabled ? "is-on" : ""}`}
                      onClick={() => updateRule(r.id, { enabled: !r.enabled })}
                      role="switch"
                      title={
                        r.enabled
                          ? t("settings.enabled")
                          : t("settings.disabled")
                      }
                      type="button"
                    >
                      <span className="ref-settings-toggle-knob" />
                    </button>
                    {renderOriginBadge(r.origin)}
                    <input
                      aria-label={t("agentSettings.ruleNameAria")}
                      className="ref-settings-agent-item-name"
                      onChange={(e) =>
                        updateRule(r.id, { name: e.target.value })
                      }
                      value={r.name}
                    />
                    <button
                      aria-label={collapsed ? "Expand" : "Collapse"}
                      className={`ref-settings-agent-collapse ${collapsed ? "is-collapsed" : ""}`}
                      onClick={() =>
                        toggleCollapse(collapsedRules, setCollapsedRules, r.id)
                      }
                      type="button"
                    >
                      <IconChevDown />
                    </button>
                    <button
                      className="ref-settings-agent-remove"
                      onClick={() => removeRule(r.id)}
                      type="button"
                    >
                      {t("settings.removeModel")}
                    </button>
                  </div>
                  {!collapsed && (
                    <>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.itemScopeStorage")}</span>
                        <VoidSelect
                          onChange={(v) =>
                            updateRule(r.id, { origin: v as AgentItemOrigin })
                          }
                          options={[
                            {
                              label: t("agentSettings.originUser"),
                              value: "user",
                            },
                            {
                              disabled: !workspaceOpen,
                              label: t("agentSettings.originProject"),
                              value: "project",
                            },
                          ]}
                          value={r.origin ?? "user"}
                        />
                      </label>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.scope")}</span>
                        <VoidSelect
                          onChange={(v) =>
                            updateRule(r.id, { scope: v as AgentRuleScope })
                          }
                          options={[
                            {
                              label: t("agentSettings.scopeAlways"),
                              value: "always",
                            },
                            {
                              label: t("agentSettings.scopeGlob"),
                              value: "glob",
                            },
                            {
                              label: t("agentSettings.scopeManual"),
                              value: "manual",
                            },
                          ]}
                          value={r.scope}
                        />
                      </label>
                      {r.scope === "glob" ? (
                        <label className="ref-settings-field ref-settings-field--compact">
                          <span>{t("agentSettings.globPattern")}</span>
                          <input
                            onChange={(e) =>
                              updateRule(r.id, { globPattern: e.target.value })
                            }
                            placeholder="**/*.tsx"
                            value={r.globPattern ?? ""}
                          />
                        </label>
                      ) : null}
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.ruleBody")}</span>
                        <textarea
                          onChange={(e) =>
                            updateRule(r.id, { content: e.target.value })
                          }
                          placeholder={t("agentSettings.ruleBodyPh")}
                          rows={4}
                          value={r.content}
                        />
                      </label>
                    </>
                  )}
                </li>
              );
            })}
        </ul>
        {rules.length === 0 ? (
          <p className="ref-settings-agent-empty">
            {t("agentSettings.rulesEmpty")}
          </p>
        ) : rules.filter((r) => itemMatchesLibraryFilter(r, libraryFilter))
            .length === 0 ? (
          <p className="ref-settings-agent-empty">
            {t("agentSettings.rulesEmptyFiltered")}
          </p>
        ) : null}
      </section>

      {/* ─── Skills ─── */}
      <section
        aria-labelledby="agent-skills-h"
        className="ref-settings-agent-section"
      >
        <div className="ref-settings-agent-section-head ref-settings-agent-section-head--wrap">
          <h2 className="ref-settings-agent-section-title" id="agent-skills-h">
            {t("agentSettings.skillsTitle")}
            <span
              className="ref-settings-agent-info-ico"
              title={t("agentSettings.skillsInfo")}
            >
              <IconInfo />
            </span>
          </h2>
          <div className="ref-settings-agent-head-actions">
            <div className="ref-settings-agent-template-dropdown">
              <button
                className="ref-settings-agent-new-btn ref-settings-agent-new-btn--secondary"
                title="From template"
                type="button"
              >
                {t("agentSettings.skillsTemplate")}
              </button>
              <div className="ref-settings-agent-template-menu">
                {SKILL_TEMPLATES.map((tmpl) => (
                  <button
                    className="ref-settings-agent-template-item"
                    key={tmpl.id}
                    onClick={() => addSkillFromTemplate(tmpl)}
                    type="button"
                  >
                    <div className="ref-settings-agent-template-name">
                      {tmpl.name}
                    </div>
                    <div className="ref-settings-agent-template-desc">
                      {tmpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              className="ref-settings-agent-new-btn ref-settings-agent-new-btn--secondary"
              onClick={() => {
                setImportOpen((v) => !v);
                setImportError(null);
              }}
              type="button"
            >
              {t("agentSettings.skillsImport")}
            </button>
            {onRefreshDiskSkills ? (
              <button
                className="ref-settings-agent-new-btn ref-settings-agent-new-btn--secondary"
                onClick={() => onRefreshDiskSkills()}
                title={
                  t("agentSettings.skillsRefreshTitle") || "Rescan disk skills"
                }
                type="button"
              >
                <svg
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: 4 }}
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <path
                    d="M23 4v6h-6M1 20v-6h6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("agentSettings.skillsRefresh")}
              </button>
            ) : null}
            {onOpenSkillCreator ? (
              <button
                className="ref-settings-agent-new-btn"
                onClick={() => void onOpenSkillCreator()}
                type="button"
              >
                {t("agentSettings.skillsNew")}
              </button>
            ) : null}
          </div>
        </div>
        <p className="ref-settings-agent-section-desc">
          {t("agentSettings.skillsDesc")}
        </p>
        {importOpen && (
          <div className="ref-settings-agent-import-box">
            <label className="ref-settings-field">
              <span>{t("agentSettings.skillsImportPrompt")}</span>
              <textarea
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                placeholder="---\nname: My Skill\nslug: my-skill\ndescription: ...\n---\n\n## Steps\n1. ..."
                rows={6}
                value={importText}
              />
            </label>
            {importError ? (
              <p className="ref-settings-agent-import-error">{importError}</p>
            ) : null}
            <div className="ref-settings-agent-import-actions">
              <button
                className="ref-settings-agent-new-btn"
                onClick={() => {
                  if (importSkillFromMarkdown(importText)) {
                    setImportOpen(false);
                    setImportText("");
                    setImportError(null);
                  } else {
                    setImportError(
                      t("agentSettings.skillsImportError") ||
                        "Failed to parse SKILL.md, please check format"
                    );
                  }
                }}
                type="button"
              >
                {t("common.confirm")}
              </button>
              <button
                className="ref-settings-agent-new-btn ref-settings-agent-new-btn--secondary"
                onClick={() => {
                  setImportOpen(false);
                  setImportText("");
                  setImportError(null);
                }}
                type="button"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
        {(() => {
          const pluginFiltered = pluginSkills.filter((s) =>
            itemMatchesLibraryFilter(s, libraryFilter)
          );
          const diskFiltered = diskSkillsAll.filter((s) =>
            itemMatchesLibraryFilter(s, libraryFilter)
          );
          const editableFiltered = editableSkills.filter((s) =>
            itemMatchesLibraryFilter(s, libraryFilter)
          );
          const visibleSkillCount =
            pluginFiltered.length +
            diskFiltered.length +
            editableFiltered.length;
          return (
            <>
              {pluginFiltered.length > 0 ? (
                <details
                  className="ref-settings-provider-details"
                  style={{ marginBottom: 14 }}
                >
                  <summary className="ref-settings-provider-summary">
                    <span
                      aria-hidden
                      className="ref-settings-provider-summary-chev"
                    />
                    <span className="ref-settings-provider-summary-text">
                      {t("agentSettings.pluginSkillsTitle")}
                    </span>
                    <span className="ref-settings-provider-summary-tag">
                      {String(pluginFiltered.length)}
                    </span>
                  </summary>
                  <ul
                    className="ref-settings-agent-skill-disk-list"
                    style={{ marginTop: 14 }}
                  >
                    {pluginFiltered.map((s) => (
                      <li
                        className="ref-settings-agent-skill-disk-card"
                        key={s.id}
                      >
                        <div className="ref-settings-agent-skill-disk-main">
                          <div className="ref-settings-plugins-badge-row">
                            <BadgeLike
                              text={
                                s.pluginSourceName ?? t("settings.nav.plugins")
                              }
                            />
                            <BadgeLike text={`./${s.slug}`} />
                          </div>
                          <div className="ref-settings-agent-skill-disk-title">
                            {s.name}
                          </div>
                          <div className="ref-settings-agent-skill-disk-desc">
                            {s.description}
                          </div>
                          {s.pluginSourceRelPath ? (
                            <div
                              className="ref-settings-agent-skill-disk-path"
                              title={s.pluginSourceRelPath}
                            >
                              {s.pluginSourceRelPath}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {diskFiltered.length > 0 ? (
                <>
                  <ul className="ref-settings-agent-skill-disk-list">
                    {diskFiltered.map((s) => {
                      const rel = s.skillSourceRelPath;
                      const busy = diskSkillDeletingId === s.id;
                      const canOpen = !!onOpenWorkspaceSkillFile && !!rel;
                      const enabled = s.enabled !== false;
                      return (
                        <li
                          className="ref-settings-agent-skill-disk-card"
                          key={s.id}
                        >
                          <button
                            aria-label={t("agentSettings.skillDiskOpenAria", {
                              name: s.name,
                            })}
                            className={`ref-settings-agent-skill-disk-main ${canOpen ? "is-clickable" : ""}`}
                            disabled={!canOpen || busy}
                            onClick={() => rel && onDiskCardOpenClick(rel)}
                            type="button"
                          >
                            <div className="ref-settings-agent-skill-disk-title">
                              {s.name}
                              {isGlobalDiskImportedSkill(s) ? (
                                <span className="ref-settings-agent-origin-badge ref-settings-agent-origin-badge--user">
                                  {t("agentSettings.originUser")}
                                </span>
                              ) : (
                                <span className="ref-settings-agent-origin-badge ref-settings-agent-origin-badge--project">
                                  {t("agentSettings.originProject")}
                                </span>
                              )}
                            </div>
                            <div className="ref-settings-agent-skill-disk-desc">
                              {s.description}
                            </div>
                            <div
                              className="ref-settings-agent-skill-disk-path"
                              title={
                                rel ??
                                (isGlobalDiskImportedSkill(s)
                                  ? "~/.claude/skills/"
                                  : "")
                              }
                            >
                              {rel ??
                                (isGlobalDiskImportedSkill(s)
                                  ? "~/.claude/skills/"
                                  : "")}
                            </div>
                          </button>
                          <div className="ref-settings-agent-skill-disk-actions">
                            <button
                              aria-checked={enabled}
                              className={`ref-settings-toggle ref-settings-toggle--sm ${enabled ? "is-on" : ""}`}
                              onClick={() => toggleDiskSkill(s)}
                              role="switch"
                              title={
                                enabled
                                  ? t("settings.enabled")
                                  : t("settings.disabled")
                              }
                              type="button"
                            >
                              <span className="ref-settings-toggle-knob" />
                            </button>
                            {!isGlobalDiskImportedSkill(s) && (
                              <button
                                aria-label={t(
                                  "agentSettings.skillDiskDeleteTitle"
                                )}
                                className="ref-settings-agent-skill-disk-trash"
                                disabled={busy || !onDeleteWorkspaceSkillDisk}
                                onClick={() => void deleteDiskSkill(s)}
                                title={t("agentSettings.skillDiskDeleteTitle")}
                                type="button"
                              >
                                <IconTrash />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
              {editableFiltered.length > 0 ? (
                <ul className="ref-settings-agent-list">
                  {editableFiltered.map((s) => {
                    const collapsed = collapsedSkills.has(s.id);
                    const rowDraggable = reorderEnabled;
                    return (
                      <li
                        className={`ref-settings-agent-item ${skillsDrag.dragId === s.id ? "is-dragging" : ""}`}
                        draggable={rowDraggable}
                        key={s.id}
                        onDragEnd={skillsDrag.onDragEnd}
                        onDragOver={skillsDrag.onDragOver}
                        onDragStart={(e) =>
                          rowDraggable && skillsDrag.onDragStart(e, s.id)
                        }
                        onDrop={(e) => skillsDrag.onDrop(e, s.id)}
                      >
                        <div className="ref-settings-agent-item-head">
                          <span
                            aria-hidden
                            className="ref-settings-agent-drag-handle"
                          >
                            <IconDrag />
                          </span>
                          <button
                            aria-checked={s.enabled !== false}
                            className={`ref-settings-toggle ref-settings-toggle--sm ${s.enabled === false ? "" : "is-on"}`}
                            onClick={() =>
                              updateSkill(s.id, {
                                enabled: s.enabled === false ? true : false,
                              })
                            }
                            role="switch"
                            title={
                              s.enabled === false
                                ? t("settings.disabled")
                                : t("settings.enabled")
                            }
                            type="button"
                          >
                            <span className="ref-settings-toggle-knob" />
                          </button>
                          {renderOriginBadge(s.origin)}
                          <input
                            aria-label={t("agentSettings.skillNameAria")}
                            className="ref-settings-agent-item-name"
                            onChange={(e) =>
                              updateSkill(s.id, { name: e.target.value })
                            }
                            value={s.name}
                          />
                          <button
                            aria-label={collapsed ? "Expand" : "Collapse"}
                            className={`ref-settings-agent-collapse ${collapsed ? "is-collapsed" : ""}`}
                            onClick={() =>
                              toggleCollapse(
                                collapsedSkills,
                                setCollapsedSkills,
                                s.id
                              )
                            }
                            type="button"
                          >
                            <IconChevDown />
                          </button>
                          <button
                            className="ref-settings-agent-remove"
                            onClick={() => removeSkill(s.id)}
                            type="button"
                          >
                            {t("settings.removeModel")}
                          </button>
                        </div>
                        {!collapsed && (
                          <>
                            <label className="ref-settings-field ref-settings-field--compact">
                              <span>{t("agentSettings.itemScopeStorage")}</span>
                              <VoidSelect
                                onChange={(v) =>
                                  updateSkill(s.id, {
                                    origin: v as AgentItemOrigin,
                                  })
                                }
                                options={[
                                  {
                                    label: t("agentSettings.originUser"),
                                    value: "user",
                                  },
                                  {
                                    disabled: !workspaceOpen,
                                    label: t("agentSettings.originProject"),
                                    value: "project",
                                  },
                                ]}
                                value={s.origin ?? "user"}
                              />
                            </label>
                            <label className="ref-settings-field ref-settings-field--compact">
                              <span>{t("agentSettings.slugLabel")}</span>
                              <input
                                onChange={(e) =>
                                  updateSkill(s.id, {
                                    slug: e.target.value.replace(/^\.\//, ""),
                                  })
                                }
                                placeholder="review"
                                value={s.slug}
                              />
                            </label>
                            <label className="ref-settings-field ref-settings-field--compact">
                              <span>{t("agentSettings.skillIntro")}</span>
                              <input
                                onChange={(e) =>
                                  updateSkill(s.id, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder={t("agentSettings.skillIntroPh")}
                                value={s.description}
                              />
                            </label>
                            <label className="ref-settings-field ref-settings-field--compact">
                              <span>{t("agentSettings.skillBody")}</span>
                              <textarea
                                onChange={(e) =>
                                  updateSkill(s.id, { content: e.target.value })
                                }
                                placeholder={t("agentSettings.skillBodyPh")}
                                rows={5}
                                value={s.content}
                              />
                            </label>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {visibleSkillCount === 0 &&
              skills.length === 0 ? null : visibleSkillCount === 0 ? (
                <p className="ref-settings-agent-empty">
                  {t("agentSettings.skillsEmptyFiltered")}
                </p>
              ) : null}
            </>
          );
        })()}
        {skills.length === 0 ? (
          <div className="ref-settings-agent-empty-block">
            <p>{t("agentSettings.skillsEmpty")}</p>
            {onOpenSkillCreator ? (
              <div className="ref-settings-agent-empty-actions">
                <button
                  className="ref-settings-agent-empty-cta"
                  onClick={() => void onOpenSkillCreator()}
                  type="button"
                >
                  {t("agentSettings.skillsNew")}
                </button>
              </div>
            ) : null}
          </div>
        ) : skills.filter((s) => itemMatchesLibraryFilter(s, libraryFilter))
            .length === 0 ? (
          <div className="ref-settings-agent-empty-block">
            <p>{t("agentSettings.skillsEmptyFiltered")}</p>
            {onOpenSkillCreator ? (
              <div className="ref-settings-agent-empty-actions">
                <button
                  className="ref-settings-agent-empty-cta"
                  onClick={() => void onOpenSkillCreator()}
                  type="button"
                >
                  {t("agentSettings.skillsNew")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ─── Subagents ─── */}
      <section
        aria-labelledby="agent-subs-h"
        className="ref-settings-agent-section"
      >
        <div className="ref-settings-agent-section-head">
          <h2 className="ref-settings-agent-section-title" id="agent-subs-h">
            {t("agentSettings.subagentsTitle")}
            <span
              className="ref-settings-agent-info-ico"
              title={t("agentSettings.subagentsInfo")}
            >
              <IconInfo />
            </span>
          </h2>
          <button
            className="ref-settings-agent-new-btn"
            disabled={!canAddProjectItem}
            onClick={addSub}
            title={
              canAddProjectItem
                ? undefined
                : t("agentSettings.needWorkspaceForProject")
            }
            type="button"
          >
            + {t("agentSettings.new")}
          </button>
        </div>
        <p className="ref-settings-agent-section-desc">
          {t("agentSettings.subagentsDesc")}
        </p>
        <ul className="ref-settings-agent-list">
          {subagents
            .filter((s) => itemMatchesLibraryFilter(s, libraryFilter))
            .map((s) => {
              const collapsed = collapsedSubs.has(s.id);
              const memoryLabel = getSubagentMemoryLabel(s.memoryScope);
              return (
                <li
                  className={`ref-settings-agent-item ${subsDrag.dragId === s.id ? "is-dragging" : ""}`}
                  draggable={reorderEnabled}
                  key={s.id}
                  onDragEnd={subsDrag.onDragEnd}
                  onDragOver={subsDrag.onDragOver}
                  onDragStart={(e) => subsDrag.onDragStart(e, s.id)}
                  onDrop={(e) => subsDrag.onDrop(e, s.id)}
                >
                  <div className="ref-settings-agent-item-head">
                    <span
                      aria-hidden
                      className="ref-settings-agent-drag-handle"
                    >
                      <IconDrag />
                    </span>
                    <button
                      aria-checked={s.enabled !== false}
                      className={`ref-settings-toggle ref-settings-toggle--sm ${s.enabled === false ? "" : "is-on"}`}
                      onClick={() =>
                        updateSub(s.id, {
                          enabled: s.enabled === false ? true : false,
                        })
                      }
                      role="switch"
                      title={
                        s.enabled === false
                          ? t("settings.disabled")
                          : t("settings.enabled")
                      }
                      type="button"
                    >
                      <span className="ref-settings-toggle-knob" />
                    </button>
                    {renderOriginBadge(s.origin)}
                    {memoryLabel ? (
                      <span
                        className="ref-settings-agent-memory-badge"
                        title={`${t("agentSettings.subMemoryScope")}: ${memoryLabel}`}
                      >
                        {memoryLabel}
                      </span>
                    ) : null}
                    <input
                      aria-label={t("agentSettings.subNameAria")}
                      className="ref-settings-agent-item-name"
                      onChange={(e) =>
                        updateSub(s.id, { name: e.target.value })
                      }
                      value={s.name}
                    />
                    <button
                      aria-label={collapsed ? "Expand" : "Collapse"}
                      className={`ref-settings-agent-collapse ${collapsed ? "is-collapsed" : ""}`}
                      onClick={() =>
                        toggleCollapse(collapsedSubs, setCollapsedSubs, s.id)
                      }
                      type="button"
                    >
                      <IconChevDown />
                    </button>
                    <button
                      className="ref-settings-agent-remove"
                      onClick={() => removeSub(s.id)}
                      type="button"
                    >
                      {t("settings.removeModel")}
                    </button>
                  </div>
                  {!collapsed && (
                    <>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.itemScopeStorage")}</span>
                        <VoidSelect
                          onChange={(v) =>
                            updateSub(s.id, { origin: v as AgentItemOrigin })
                          }
                          options={[
                            {
                              label: t("agentSettings.originUser"),
                              value: "user",
                            },
                            {
                              disabled: !workspaceOpen,
                              label: t("agentSettings.originProject"),
                              value: "project",
                            },
                          ]}
                          value={s.origin ?? "user"}
                        />
                      </label>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.subDesc")}</span>
                        <input
                          onChange={(e) =>
                            updateSub(s.id, { description: e.target.value })
                          }
                          placeholder={t("agentSettings.subDescPh")}
                          value={s.description}
                        />
                      </label>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.subMemoryScope")}</span>
                        <VoidSelect
                          onChange={(v) =>
                            updateSub(s.id, {
                              memoryScope:
                                v === "none"
                                  ? undefined
                                  : (v as AgentMemoryScope),
                            })
                          }
                          options={subagentMemoryOptions}
                          value={s.memoryScope ?? "none"}
                        />
                        <small className="ref-settings-field-hint">
                          {t("agentSettings.subMemoryScopeHint")}
                        </small>
                      </label>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("agentSettings.subInstr")}</span>
                        <textarea
                          onChange={(e) =>
                            updateSub(s.id, { instructions: e.target.value })
                          }
                          placeholder={t("agentSettings.subInstrPh")}
                          rows={5}
                          value={s.instructions}
                        />
                      </label>
                    </>
                  )}
                </li>
              );
            })}
        </ul>
        {subagents.length === 0 ? (
          <div className="ref-settings-agent-empty-block">
            <p>{t("agentSettings.subEmpty")}</p>
            <button
              className="ref-settings-agent-empty-cta"
              disabled={!canAddProjectItem}
              onClick={addSub}
              type="button"
            >
              {t("agentSettings.newSub")}
            </button>
          </div>
        ) : subagents.filter((s) => itemMatchesLibraryFilter(s, libraryFilter))
            .length === 0 ? (
          <div className="ref-settings-agent-empty-block">
            <p>{t("agentSettings.subEmptyFiltered")}</p>
            <button
              className="ref-settings-agent-empty-cta"
              disabled={!canAddProjectItem}
              onClick={addSub}
              type="button"
            >
              {t("agentSettings.newSub")}
            </button>
          </div>
        ) : null}
      </section>

      {/* ─── Commands ─── */}
      <section
        aria-labelledby="agent-cmd-h"
        className="ref-settings-agent-section"
      >
        <div className="ref-settings-agent-section-head">
          <h2 className="ref-settings-agent-section-title" id="agent-cmd-h">
            {t("agentSettings.cmdTitle")}
            <span
              className="ref-settings-agent-info-ico"
              title={t("agentSettings.cmdInfo")}
            >
              <IconInfo />
            </span>
          </h2>
          <button
            className="ref-settings-agent-new-btn"
            onClick={addCmd}
            type="button"
          >
            + {t("agentSettings.new")}
          </button>
        </div>
        <p className="ref-settings-agent-section-desc">
          {t("agentSettings.cmdDesc")}
        </p>
        <div
          aria-label={t("agentSettings.cmdSlashListAria")}
          className="ref-settings-agent-slash-help"
        >
          <h3 className="ref-settings-agent-subheading">
            {t("agentSettings.cmdSlashListTitle")}
          </h3>
          <div
            className={`ref-settings-agent-slash-help-list-shell ${shouldCollapseSlashHelp ? (slashHelpExpanded ? "is-expanded" : "is-collapsed") : "is-static"}`}
            style={
              slashHelpVisibleHeight
                ? { maxHeight: `${slashHelpVisibleHeight}px` }
                : undefined
            }
          >
            <ul
              className="ref-settings-agent-slash-help-list"
              id="ref-settings-agent-slash-help-list"
              ref={slashHelpListRef}
            >
              {slashCmdHelpRows.map((row, i) => (
                <li
                  className="ref-settings-agent-slash-help-item"
                  key={`${row.label}-${i}`}
                >
                  <div className="ref-settings-agent-slash-help-row">
                    <code className="ref-settings-agent-slash-help-code">
                      {row.label}
                    </code>
                    <span
                      className={`ref-settings-agent-slash-help-badge ${row.source === "builtin" ? "" : "ref-settings-agent-slash-help-badge--user"}`}
                    >
                      {row.source === "builtin"
                        ? t("slashCmd.helpBuiltin")
                        : row.source === "plugin"
                          ? t("slashCmd.helpPlugin")
                          : t("slashCmd.helpUser")}
                    </span>
                  </div>
                  {row.description ? (
                    <p className="ref-settings-agent-slash-help-desc">
                      {row.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          {shouldCollapseSlashHelp ? (
            <div className="ref-settings-agent-slash-help-actions">
              <button
                aria-controls="ref-settings-agent-slash-help-list"
                aria-expanded={slashHelpExpanded}
                className={`ref-settings-agent-slash-help-toggle ${slashHelpExpanded ? "is-expanded" : ""}`}
                onClick={() => setSlashHelpExpanded((prev) => !prev)}
                type="button"
              >
                <span>
                  {slashHelpExpanded
                    ? t("agentSettings.cmdSlashListCollapse")
                    : t("agentSettings.cmdSlashListExpand", {
                        count: String(hiddenSlashCount),
                      })}
                </span>
                <IconChevDown className="ref-settings-agent-slash-help-toggle-ico" />
              </button>
            </div>
          ) : null}
        </div>
        {pluginCommands.length > 0 ? (
          <details
            className="ref-settings-provider-details"
            style={{ marginBottom: 14 }}
          >
            <summary className="ref-settings-provider-summary">
              <span
                aria-hidden
                className="ref-settings-provider-summary-chev"
              />
              <span className="ref-settings-provider-summary-text">
                {t("agentSettings.pluginCommandsTitle")}
              </span>
              <span className="ref-settings-provider-summary-tag">
                {String(pluginCommands.length)}
              </span>
            </summary>
            <ul
              className="ref-settings-agent-skill-disk-list"
              style={{ marginTop: 14 }}
            >
              {pluginCommands.map((c) => (
                <li className="ref-settings-agent-skill-disk-card" key={c.id}>
                  <div className="ref-settings-agent-skill-disk-main">
                    <div className="ref-settings-plugins-badge-row">
                      <BadgeLike
                        text={c.pluginSourceName ?? t("settings.nav.plugins")}
                      />
                      <BadgeLike text={`/${c.slash}`} />
                    </div>
                    <div className="ref-settings-agent-skill-disk-title">
                      {c.name}
                    </div>
                    <div className="ref-settings-agent-skill-disk-desc">
                      {c.description ||
                        t("agentSettings.pluginCommandFallbackDesc")}
                    </div>
                    {c.pluginSourceRelPath ? (
                      <div
                        className="ref-settings-agent-skill-disk-path"
                        title={c.pluginSourceRelPath}
                      >
                        {c.pluginSourceRelPath}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        <ul className="ref-settings-agent-list">
          {editableCommands.map((c) => {
            const collapsed = collapsedCmds.has(c.id);
            return (
              <li
                className={`ref-settings-agent-item ${cmdsDrag.dragId === c.id ? "is-dragging" : ""}`}
                draggable
                key={c.id}
                onDragEnd={cmdsDrag.onDragEnd}
                onDragOver={cmdsDrag.onDragOver}
                onDragStart={(e) => cmdsDrag.onDragStart(e, c.id)}
                onDrop={(e) => cmdsDrag.onDrop(e, c.id)}
              >
                <div className="ref-settings-agent-item-head">
                  <span aria-hidden className="ref-settings-agent-drag-handle">
                    <IconDrag />
                  </span>
                  <input
                    aria-label={t("agentSettings.cmdNameAria")}
                    className="ref-settings-agent-item-name"
                    onChange={(e) => updateCmd(c.id, { name: e.target.value })}
                    value={c.name}
                  />
                  <button
                    aria-label={collapsed ? "Expand" : "Collapse"}
                    className={`ref-settings-agent-collapse ${collapsed ? "is-collapsed" : ""}`}
                    onClick={() =>
                      toggleCollapse(collapsedCmds, setCollapsedCmds, c.id)
                    }
                    type="button"
                  >
                    <IconChevDown />
                  </button>
                  <button
                    className="ref-settings-agent-remove"
                    onClick={() => removeCmd(c.id)}
                    type="button"
                  >
                    {t("settings.removeModel")}
                  </button>
                </div>
                {!collapsed && (
                  <>
                    <label className="ref-settings-field ref-settings-field--compact">
                      <span>{t("agentSettings.slashLabel")}</span>
                      <input
                        onChange={(e) =>
                          updateCmd(c.id, {
                            slash: e.target.value.replace(/^\//, ""),
                          })
                        }
                        placeholder="plan"
                        value={c.slash}
                      />
                    </label>
                    <label className="ref-settings-field ref-settings-field--compact">
                      <span>{t("agentSettings.cmdDescField")}</span>
                      <input
                        autoComplete="off"
                        onChange={(e) =>
                          updateCmd(c.id, { description: e.target.value })
                        }
                        placeholder={t("agentSettings.cmdDescFieldPh")}
                        value={c.description ?? ""}
                      />
                    </label>
                    <label className="ref-settings-field ref-settings-field--compact">
                      <span>{t("agentSettings.cmdTemplate")}</span>
                      <textarea
                        onChange={(e) =>
                          updateCmd(c.id, { body: e.target.value })
                        }
                        placeholder={t("agentSettings.cmdTemplatePh")}
                        rows={4}
                        value={c.body}
                      />
                    </label>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {commands.length === 0 ? (
          <div className="ref-settings-agent-empty-block">
            <p>{t("agentSettings.cmdEmpty")}</p>
            <button
              className="ref-settings-agent-empty-cta"
              onClick={addCmd}
              type="button"
            >
              {t("agentSettings.newCmd")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
