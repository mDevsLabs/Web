import { useI18n } from "./i18n";

type Props = { lang: string; body: string; onRun?: () => void };

function IconTerminal({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <path d="M7 10l3 2-3 2M13 14h4" strokeLinecap="round" />
    </svg>
  );
}

/** 短命令块（npm run / 验证构建等），参考 Cursor 侧栏命令行条目 */
export function AgentCommandCard({ lang, body, onRun }: Props) {
  const { t } = useI18n();
  const runLabelRaw = t("agent.command.run");
  const runLabel =
    runLabelRaw === "agent.command.run" ? "Run in Terminal" : runLabelRaw;
  return (
    <div aria-label="命令" className="ref-agent-command-card" role="note">
      <span aria-hidden className="ref-agent-command-ico">
        <IconTerminal className="ref-agent-command-ico-svg" />
      </span>
      <div className="ref-agent-command-body">
        <span className="ref-agent-command-lang">{lang}</span>
        <pre className="ref-agent-command-pre">{body}</pre>
      </div>
      {onRun ? (
        <button
          aria-label={runLabel}
          className="ref-agent-command-run"
          onClick={onRun}
          title={runLabel}
          type="button"
        >
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <polygon fill="currentColor" points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
