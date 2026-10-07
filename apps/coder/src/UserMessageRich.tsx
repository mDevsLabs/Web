import {
  type ComposerSegment,
  skillInvocationWire,
  slashCommandWire,
} from "./composerSegments";
import { FileTypeIcon, isRasterImageRelPath } from "./fileTypeIcons";

function fileBasename(path: string): string {
  const n = path.replace(/\\/g, "/");
  return n.split("/").pop() || n;
}

type Props = {
  segments: ComposerSegment[];
  /** 点击文件 chip 时（需 stopPropagation 避免触发外层「编辑整条」） */
  onFileClick: (relPath: string) => void;
};

/**
 * 已发送用户消息的只读展示：与输入框内 chip 样式一致，可点击打开文件。
 */
export function UserMessageRich({ segments, onFileClick }: Props) {
  return (
    <div className="ref-msg-user-rich">
      {segments.map((s) =>
        s.kind === "text" ? (
          <span className="ref-msg-user-rich-text" key={s.id}>
            {s.text}
          </span>
        ) : s.kind === "command" ? (
          <span
            aria-hidden
            className="ref-inline-slash-chip ref-inline-slash-chip--readonly"
            key={s.id}
          >
            <span className="ref-inline-slash-chip-label">
              {slashCommandWire(s.command)}
            </span>
          </span>
        ) : s.kind === "skill" ? (
          <span
            aria-hidden
            className="ref-inline-skill-chip ref-inline-skill-chip--readonly"
            key={s.id}
            title={
              s.name
                ? `${s.name} · ${skillInvocationWire(s.slug)}`
                : skillInvocationWire(s.slug)
            }
          >
            <span className="ref-inline-skill-chip-label">
              {s.name || skillInvocationWire(s.slug)}
            </span>
          </span>
        ) : s.kind === "file" ? (
          <span
            className={[
              "ref-inline-file-chip",
              "ref-inline-file-chip--readonly",
              isRasterImageRelPath(s.path) ? "ref-inline-file-chip--image" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={s.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFileClick(s.path);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onFileClick(s.path);
              }
            }}
            role="button"
            tabIndex={0}
            title={s.path}
          >
            <span aria-hidden className="ref-inline-file-chip-ico">
              <FileTypeIcon
                className="ref-inline-file-chip-svg"
                fileName={fileBasename(s.path)}
                isDirectory={false}
              />
            </span>
            <span className="ref-inline-file-chip-name">
              {fileBasename(s.path)}
            </span>
          </span>
        ) : null
      )}
    </div>
  );
}
