import { memo, useState } from "react";
import type { ToolCallSegment } from "./agentChatSegments";
import { useI18n } from "./i18n";
import {
  IconBookOpen,
  IconCheck,
  IconDoc,
  IconExplorer,
  IconFolderOpen,
  IconGlobe,
  IconListFilter,
  IconMessageCircle,
  IconPencil,
  IconPlug,
  IconSearch,
  IconTeam,
  IconTerminal,
  IconWrench,
  IconX,
} from "./icons";

const TOOL_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Agent: IconTeam,
  Bash: IconTerminal,
  delegate_task: IconTeam,
  Edit: IconPencil,
  execute_command: IconTerminal,
  Glob: IconFolderOpen,
  Grep: IconSearch,
  get_diagnostics: IconSearch,
  ListMcpResourcesTool: IconPlug,
  LSP: IconSearch,
  list_dir: IconExplorer,
  Read: IconBookOpen,
  ReadMcpResourceTool: IconPlug,
  read_file: IconBookOpen,
  request_user_input: IconMessageCircle,
  search_files: IconSearch,
  str_replace: IconPencil,
  Task: IconTeam,
  TodoWrite: IconListFilter,
  ToolSearch: IconGlobe,
  Write: IconDoc,
  write_to_file: IconDoc,
};

function summarizeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "Read":
    case "read_file":
      return String(args.file_path ?? args.path ?? "");
    case "Write":
    case "write_to_file":
      return String(args.file_path ?? args.path ?? "");
    case "Edit":
    case "str_replace":
      return String(args.file_path ?? args.path ?? "");
    case "Glob":
      return String(args.pattern ?? "");
    case "list_dir":
      return String(args.path ?? "") || ".";
    case "Grep":
    case "search_files":
      return String(args.pattern ?? "");
    case "LSP": {
      const op = String(args.operation ?? "");
      const fp = String(args.filePath ?? args.path ?? "");
      return op && fp ? `${op} ${fp}` : op || fp || "";
    }
    case "get_diagnostics":
      return String(args.path ?? args.file_path ?? "");
    case "Bash":
    case "execute_command":
      return String(args.command ?? "");
    case "ListMcpResourcesTool":
      return String(args.server ?? "") || "(all servers)";
    case "ReadMcpResourceTool":
      return `${String(args.server ?? "")} ${String(args.uri ?? "")}`.trim();
    case "ToolSearch":
      return (
        String(args.query ?? args.pattern ?? args.term ?? "") ||
        "(all deferred tools)"
      );
    case "Agent":
    case "delegate_task":
    case "Task":
      return String(args.prompt ?? args.task ?? "").slice(0, 100);
    case "request_user_input": {
      const questions = args.questions;
      if (Array.isArray(questions)) {
        return `${questions.length} question${questions.length === 1 ? "" : "s"}`;
      }
      return "";
    }
    case "TodoWrite": {
      const todos = args.todos;
      if (Array.isArray(todos)) {
        const done = todos.filter((t: any) => t.status === "completed").length;
        return `${done}/${todos.length} tasks`;
      }
      return "";
    }
    default:
      return JSON.stringify(args).slice(0, 80);
  }
}

type Props = {
  segment: ToolCallSegment;
};

export const AgentToolCard = memo(function AgentToolCard({ segment }: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const IconComp = TOOL_ICON_MAP[segment.name] ?? IconWrench;
  const toolKey = `agent.tool.${segment.name}`;
  const translated = t(toolKey);
  const label = translated === toolKey ? segment.name : translated;
  const summary = summarizeArgs(segment.name, segment.args);
  const hasResult = segment.result !== undefined;
  const isSuccess = segment.success !== false;

  return (
    <div
      className={`ref-tool-card ${hasResult ? (isSuccess ? "ref-tool-card--ok" : "ref-tool-card--err") : "ref-tool-card--pending"}`}
    >
      <button
        aria-expanded={expanded}
        className="ref-tool-card-header"
        onClick={() => setExpanded((e) => !e)}
        type="button"
      >
        <span aria-hidden className="ref-tool-card-icon">
          <IconComp />
        </span>
        <span className="ref-tool-card-label">{label}</span>
        <span className="ref-tool-card-summary" title={summary}>
          {summary}
        </span>
        {hasResult && (
          <span
            aria-label={isSuccess ? "success" : "error"}
            className={`ref-tool-card-status ${isSuccess ? "ref-tool-card-status--ok" : "ref-tool-card-status--err"}`}
          >
            {isSuccess ? <IconCheck /> : <IconX />}
          </span>
        )}
        {!hasResult && <span className="ref-tool-card-spinner" />}
        <svg
          className={`ref-tool-card-chevron ${expanded ? "ref-tool-card-chevron--open" : ""}`}
          fill="none"
          height="14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="14"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {expanded && (
        <div className="ref-tool-card-body">
          <div className="ref-tool-card-section">
            <div className="ref-tool-card-section-title">
              {t("agent.toolCard.args")}
            </div>
            <pre className="ref-tool-card-pre">
              {formatArgs(segment.name, segment.args)}
            </pre>
          </div>
          {hasResult && (
            <div className="ref-tool-card-section">
              <div className="ref-tool-card-section-title">
                {t("agent.toolCard.result")}
              </div>
              <pre className="ref-tool-card-pre">{segment.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

function formatArgs(name: string, args: Record<string, unknown>): string {
  const fp = args.file_path ?? args.path;
  if (name === "str_replace" || name === "Edit") {
    const lines: string[] = [];
    lines.push(`file_path: ${fp}`);
    lines.push(`old_string:\n${args.old_string ?? args.old_str}`);
    lines.push(`new_string:\n${args.new_string ?? args.new_str}`);
    if (args.replace_all != null)
      lines.push(`replace_all: ${args.replace_all}`);
    return lines.join("\n");
  }
  if (name === "write_to_file" || name === "Write") {
    const content = String(args.content ?? "");
    const preview =
      content.length > 500 ? content.slice(0, 500) + "\n..." : content;
    return `file_path: ${fp}\ncontent:\n${preview}`;
  }
  return JSON.stringify(args, null, 2);
}
