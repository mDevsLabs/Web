import { useI18n } from "./i18n";
import { VoidSelect } from "./VoidSelect";

export type EditorSettings = {
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: "off" | "on" | "wordWrapColumn" | "bounded";
  fontSize: number;
  fontFamily: string;
  lineNumbers: "on" | "off" | "relative";
  minimap: boolean;
  bracketPairColorization: boolean;
  cursorStyle: "line" | "block" | "underline";
  smoothScrolling: boolean;
  renderWhitespace: "none" | "boundary" | "all";
  formatOnSave: boolean;
  autoSave: "off" | "afterDelay" | "onFocusChange";
};

export const defaultEditorSettings = (): EditorSettings => ({
  autoSave: "off",
  bracketPairColorization: true,
  cursorStyle: "line",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace",
  fontSize: 14,
  formatOnSave: false,
  insertSpaces: false,
  lineNumbers: "on",
  minimap: true,
  renderWhitespace: "none",
  smoothScrolling: true,
  tabSize: 4,
  wordWrap: "off",
});

/** 将 EditorSettings 映射为 Monaco IEditorOptions（主编辑区为只读预览器） */
export function editorSettingsToMonacoOptions(
  s: EditorSettings
): Record<string, unknown> {
  return {
    "bracketPairColorization.enabled": s.bracketPairColorization,
    cursorStyle: s.cursorStyle,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    insertSpaces: s.insertSpaces,
    lineNumbers: s.lineNumbers,
    minimap: { enabled: s.minimap },
    readOnly: true,
    renderWhitespace: s.renderWhitespace,
    smoothScrolling: s.smoothScrolling,
    tabSize: s.tabSize,
    wordWrap: s.wordWrap,
  };
}

type Props = {
  value: EditorSettings;
  onChange: (next: EditorSettings) => void;
};

export function EditorSettingsPanel({ value, onChange }: Props) {
  const { t } = useI18n();
  const v = { ...defaultEditorSettings(), ...value };

  const patch = (p: Partial<EditorSettings>) => {
    onChange({ ...v, ...p });
  };

  return (
    <div className="ref-settings-panel ref-settings-panel--editor">
      <p className="ref-settings-lead">{t("editorSettings.lead")}</p>

      {/* ─── Text & Formatting（只读预览：隐藏 Tab/空格等编辑相关项）── */}
      <section
        aria-labelledby="editor-text-h"
        className="ref-settings-agent-section"
      >
        <h2 className="ref-settings-agent-section-title" id="editor-text-h">
          {t("editorSettings.textFormatting")}
        </h2>

        <label className="ref-settings-field ref-settings-field--compact">
          <span>{t("editorSettings.wordWrap")}</span>
          <VoidSelect
            ariaLabel={t("editorSettings.wordWrap")}
            onChange={(s) =>
              patch({ wordWrap: s as EditorSettings["wordWrap"] })
            }
            options={[
              { label: "Off", value: "off" },
              { label: "On", value: "on" },
              { label: "Word Wrap Column", value: "wordWrapColumn" },
              { label: "Bounded", value: "bounded" },
            ]}
            value={v.wordWrap}
          />
        </label>

        <label className="ref-settings-field ref-settings-field--compact">
          <span>{t("editorSettings.renderWhitespace")}</span>
          <VoidSelect
            ariaLabel={t("editorSettings.renderWhitespace")}
            onChange={(s) =>
              patch({
                renderWhitespace: s as EditorSettings["renderWhitespace"],
              })
            }
            options={[
              { label: "None", value: "none" },
              { label: "Boundary", value: "boundary" },
              { label: "All", value: "all" },
            ]}
            value={v.renderWhitespace}
          />
        </label>
      </section>

      {/* ─── Font ─── */}
      <section
        aria-labelledby="editor-font-h"
        className="ref-settings-agent-section"
      >
        <h2 className="ref-settings-agent-section-title" id="editor-font-h">
          {t("editorSettings.font")}
        </h2>

        <label className="ref-settings-field ref-settings-field--compact">
          <span>{t("editorSettings.fontSize")}</span>
          <input
            max={32}
            min={8}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 8 && n <= 32) patch({ fontSize: n });
            }}
            type="number"
            value={v.fontSize}
          />
        </label>

        <label className="ref-settings-field ref-settings-field--compact">
          <span>{t("editorSettings.fontFamily")}</span>
          <input
            onChange={(e) => patch({ fontFamily: e.target.value })}
            placeholder="ui-monospace, Menlo, Consolas, monospace"
            value={v.fontFamily}
          />
        </label>
      </section>

      {/* ─── Display ─── */}
      <section
        aria-labelledby="editor-display-h"
        className="ref-settings-agent-section"
      >
        <h2 className="ref-settings-agent-section-title" id="editor-display-h">
          {t("editorSettings.display")}
        </h2>

        <label className="ref-settings-field ref-settings-field--compact">
          <span>{t("editorSettings.lineNumbers")}</span>
          <VoidSelect
            ariaLabel={t("editorSettings.lineNumbers")}
            onChange={(s) =>
              patch({ lineNumbers: s as EditorSettings["lineNumbers"] })
            }
            options={[
              { label: "On", value: "on" },
              { label: "Off", value: "off" },
              { label: "Relative", value: "relative" },
            ]}
            value={v.lineNumbers}
          />
        </label>

        <div className="ref-settings-agent-card">
          <div className="ref-settings-agent-card-row">
            <div>
              <div className="ref-settings-agent-card-title">
                {t("editorSettings.minimap")}
              </div>
              <p className="ref-settings-agent-card-desc">
                {t("editorSettings.minimapDesc")}
              </p>
            </div>
            <button
              aria-checked={v.minimap}
              className={`ref-settings-toggle ${v.minimap ? "is-on" : ""}`}
              onClick={() => patch({ minimap: !v.minimap })}
              role="switch"
              type="button"
            >
              <span className="ref-settings-toggle-knob" />
            </button>
          </div>
        </div>

        <div className="ref-settings-agent-card">
          <div className="ref-settings-agent-card-row">
            <div>
              <div className="ref-settings-agent-card-title">
                {t("editorSettings.bracketColorization")}
              </div>
              <p className="ref-settings-agent-card-desc">
                {t("editorSettings.bracketColorizationDesc")}
              </p>
            </div>
            <button
              aria-checked={v.bracketPairColorization}
              className={`ref-settings-toggle ${v.bracketPairColorization ? "is-on" : ""}`}
              onClick={() =>
                patch({ bracketPairColorization: !v.bracketPairColorization })
              }
              role="switch"
              type="button"
            >
              <span className="ref-settings-toggle-knob" />
            </button>
          </div>
        </div>

        <div className="ref-settings-agent-card">
          <div className="ref-settings-agent-card-row">
            <div>
              <div className="ref-settings-agent-card-title">
                {t("editorSettings.smoothScrolling")}
              </div>
            </div>
            <button
              aria-checked={v.smoothScrolling}
              className={`ref-settings-toggle ${v.smoothScrolling ? "is-on" : ""}`}
              onClick={() => patch({ smoothScrolling: !v.smoothScrolling })}
              role="switch"
              type="button"
            >
              <span className="ref-settings-toggle-knob" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
