type Props = { lang: string; body: string };

/** 避免超大流式正文一次性塞进 DOM 导致窗口卡死（完整内容仍在内存，仅显示截断） */
const STREAMING_FENCE_MAX_DISPLAY_CHARS = 512 * 1024;

/**
 * 流式阶段：起始围栏已出现、闭合 ``` 尚未到达时，仍用与 Markdown 代码块一致的卡片壳展示，
 * 避免整段落在「非闭合围栏」下无法被 remark 识别为 code block。
 */
export function AgentStreamingFenceCard({ lang, body }: Props) {
  const displayBody =
    body.length > STREAMING_FENCE_MAX_DISPLAY_CHARS
      ? `${body.slice(0, STREAMING_FENCE_MAX_DISPLAY_CHARS)}\n\n…（流式预览仅显示前 ${STREAMING_FENCE_MAX_DISPLAY_CHARS.toLocaleString()} 字符，共 ${body.length.toLocaleString()} 字符）`
      : body;

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="ref-agent-streaming-fence"
      role="status"
    >
      {lang ? (
        <div className="ref-agent-streaming-fence-lang">{lang}</div>
      ) : null}
      <pre className="ref-agent-streaming-fence-pre">
        <code>{displayBody}</code>
      </pre>
    </div>
  );
}
