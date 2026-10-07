import { type CSSProperties, type ReactNode, useMemo } from "react";
import {
  APPEARANCE_THEME_PRESETS,
  APPLE_UI_FONT_STACK,
  type AppAppearanceSettings,
  applyThemePresetToAppearance,
  type CodeFontPresetId,
  defaultAppearanceSettingsForScheme,
  inferThemePresetIdForScheme,
  isAppearanceFactoryDefault,
  JETBRAINS_CODE_FONT_STACK,
  MONOSPACE_CODE_FONT_STACK,
  resolveAppearanceChromeColorVars,
  SFMONO_CODE_FONT_STACK,
  type ThemePresetId,
  type UiFontPresetId,
} from "./appearanceSettings";
import type { AppColorMode, ThemeTransitionOrigin } from "./colorMode";
import { useI18n } from "./i18n";
import { VoidSelect } from "./VoidSelect";

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMonitor({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="14" rx="2" width="20" x="2" y="3" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

function IconRotateCcw({ className }: { className?: string }) {
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
      <path
        d="M3 12a9 9 0 1 0 3-7.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  value: AppColorMode;
  onChange: (
    next: AppColorMode,
    origin?: ThemeTransitionOrigin
  ) => void | Promise<void>;
  /** 当前有效亮/暗（含「跟随系统」解析结果），用于恢复默认配色与内置 CSS 对齐 */
  effectiveColorScheme: "light" | "dark";
  appearance: AppAppearanceSettings;
  onChangeAppearance: (next: AppAppearanceSettings) => void | Promise<void>;
};

function ThemeField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="ref-appearance-theme-row">
      <div className="ref-appearance-theme-row-copy">
        <div className="ref-appearance-theme-row-label">{label}</div>
        {description ? (
          <p className="ref-appearance-theme-row-desc">{description}</p>
        ) : null}
      </div>
      <div className="ref-appearance-theme-row-control">{children}</div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function normalizeHexInput(value: string, fallback: string): string {
  const s = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    return s.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toUpperCase();
  }
  return fallback;
}

export function SettingsAppearancePanel({
  value,
  onChange,
  effectiveColorScheme,
  appearance,
  onChangeAppearance,
}: Props) {
  const { t } = useI18n();
  const modes: { id: AppColorMode; label: string; icon: ReactNode }[] = [
    {
      icon: <IconSun className="ref-appearance-seg-ico" />,
      id: "light",
      label: t("settings.appearance.light"),
    },
    {
      icon: <IconMoon className="ref-appearance-seg-ico" />,
      id: "dark",
      label: t("settings.appearance.dark"),
    },
    {
      icon: <IconMonitor className="ref-appearance-seg-ico" />,
      id: "system",
      label: t("settings.appearance.system"),
    },
  ];
  const uiFonts: { id: UiFontPresetId; label: string; stack: string }[] = [
    {
      id: "apple",
      label: t("settings.appearance.font.apple"),
      stack: APPLE_UI_FONT_STACK,
    },
    {
      id: "inter",
      label: t("settings.appearance.font.inter"),
      stack: "Inter, system-ui, sans-serif",
    },
    {
      id: "segoe",
      label: t("settings.appearance.font.segoe"),
      stack: "Segoe UI, system-ui, sans-serif",
    },
  ];
  const codeFonts: { id: CodeFontPresetId; label: string; stack: string }[] = [
    {
      id: "sfmono",
      label: t("settings.appearance.codeFont.sfmono"),
      stack: SFMONO_CODE_FONT_STACK,
    },
    {
      id: "monospace",
      label: t("settings.appearance.codeFont.monospace"),
      stack: MONOSPACE_CODE_FONT_STACK,
    },
    {
      id: "jetbrains",
      label: t("settings.appearance.codeFont.jetbrains"),
      stack: JETBRAINS_CODE_FONT_STACK,
    },
  ];
  const appliedPreviewStyle = useMemo(
    () =>
      resolveAppearanceChromeColorVars(
        appearance,
        effectiveColorScheme
      ) as CSSProperties,
    [appearance, effectiveColorScheme]
  );
  const themePresets = useMemo(
    () =>
      (Object.keys(APPEARANCE_THEME_PRESETS) as ThemePresetId[]).map((id) => ({
        dark: APPEARANCE_THEME_PRESETS[id].dark,
        id,
        label: t(`settings.appearance.preset.${id}`),
        light: APPEARANCE_THEME_PRESETS[id].light,
      })),
    [t]
  );

  const patch = (partial: Partial<AppAppearanceSettings>) => {
    void onChangeAppearance({ ...appearance, ...partial });
  };

  const patchChrome = (
    partial: Partial<
      Pick<
        AppAppearanceSettings,
        | "accentColor"
        | "backgroundColor"
        | "foregroundColor"
        | "contrast"
        | "translucentSidebar"
      >
    >
  ) => {
    const next = { ...appearance, ...partial };
    void onChangeAppearance({
      ...next,
      themePresetId: inferThemePresetIdForScheme(next, effectiveColorScheme),
    });
  };

  const handleColorChange = (
    key: "accentColor" | "backgroundColor" | "foregroundColor",
    next: string
  ) => {
    patchChrome({
      [key]: normalizeHexInput(next, appearance[key]),
    } as Partial<AppAppearanceSettings>);
  };

  const handleResetFactoryDefaults = () => {
    void onChangeAppearance(
      defaultAppearanceSettingsForScheme(effectiveColorScheme)
    );
  };

  return (
    <div className="ref-settings-panel ref-settings-panel--appearance">
      <p className="ref-appearance-lead">{t("settings.appearance.lead")}</p>

      <section
        aria-labelledby="appearance-theme-heading"
        className="ref-settings-agent-section"
      >
        <h2
          className="ref-settings-agent-section-title"
          id="appearance-theme-heading"
        >
          {t("settings.appearance.themeTitle")}
        </h2>
        <p className="ref-settings-agent-section-desc">
          {t("settings.appearance.themeDesc")}
        </p>
        <div className="ref-appearance-shell-card">
          <div className="ref-appearance-shell-card-top">
            <div
              aria-label={t("settings.appearance.ariaGroup")}
              className="ref-appearance-seg"
              role="group"
            >
              {modes.map((m) => (
                <button
                  aria-pressed={value === m.id}
                  className={`ref-appearance-seg-btn${value === m.id ? " is-active" : ""}`}
                  key={m.id}
                  onClick={(event) =>
                    void onChange(m.id, { x: event.clientX, y: event.clientY })
                  }
                  type="button"
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div aria-hidden className="ref-appearance-code-preview">
            <div
              className="ref-appearance-code-preview-scope"
              style={appliedPreviewStyle}
            >
              <div className="ref-appearance-code-pane ref-appearance-code-pane--after">
                <div className="ref-appearance-code-gutter">
                  <span>1</span>
                  <span className="is-cool">2</span>
                  <span className="is-cool">3</span>
                  <span>4</span>
                </div>
                <div className="ref-appearance-code-content">
                  <div>
                    <span className="token-key">surface</span>:{" "}
                    <span className="token-string">"sidebar-elevated"</span>,
                  </div>
                  <div>
                    <span className="token-key">accent</span>:{" "}
                    <span className="token-string">
                      "{appearance.accentColor}"
                    </span>
                    ,
                  </div>
                  <div>
                    <span className="token-key">contrast</span>:{" "}
                    <span className="token-number">{appearance.contrast}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ref-appearance-theme-editor">
            <div className="ref-appearance-theme-editor-head">
              <div>
                <h3 className="ref-appearance-theme-editor-title">
                  {t("settings.appearance.themeEditorTitle")}
                </h3>
                <p className="ref-appearance-theme-editor-desc">
                  {t("settings.appearance.themeEditorDesc")}
                </p>
              </div>
              <div className="ref-appearance-theme-editor-actions">
                <button
                  aria-label={t("settings.appearance.resetDefaultsTitle")}
                  className="ref-appearance-toolbar-btn"
                  disabled={isAppearanceFactoryDefault(
                    appearance,
                    effectiveColorScheme
                  )}
                  onClick={handleResetFactoryDefaults}
                  title={t("settings.appearance.resetDefaultsTitle")}
                  type="button"
                >
                  <IconRotateCcw />
                  {t("settings.appearance.resetDefaults")}
                </button>
              </div>
            </div>

            <ThemeField
              description={t("settings.appearance.themePresetDesc")}
              label={t("settings.appearance.themePreset")}
            >
              <div
                aria-label={t("settings.appearance.themePreset")}
                className="ref-appearance-preset-grid"
                role="list"
              >
                {themePresets.map((preset) => {
                  const active = appearance.themePresetId === preset.id;
                  return (
                    <button
                      aria-pressed={active}
                      className={`ref-appearance-preset-btn${active ? " is-active" : ""}`}
                      key={preset.id}
                      onClick={() =>
                        void onChangeAppearance(
                          applyThemePresetToAppearance(
                            appearance,
                            preset.id,
                            effectiveColorScheme
                          )
                        )
                      }
                      role="listitem"
                      type="button"
                    >
                      <span
                        aria-hidden
                        className="ref-appearance-preset-previews"
                      >
                        <span
                          className="ref-appearance-preset-mini"
                          style={
                            {
                              "--preset-accent": preset.light.accentColor,
                              "--preset-bg": preset.light.backgroundColor,
                              "--preset-fg": preset.light.foregroundColor,
                            } as CSSProperties
                          }
                        />
                        <span
                          className="ref-appearance-preset-mini"
                          style={
                            {
                              "--preset-accent": preset.dark.accentColor,
                              "--preset-bg": preset.dark.backgroundColor,
                              "--preset-fg": preset.dark.foregroundColor,
                            } as CSSProperties
                          }
                        />
                      </span>
                      <span className="ref-appearance-preset-name">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ThemeField>
            <ThemeField label={t("settings.appearance.accent")}>
              <div className="ref-appearance-color-control">
                <input
                  onChange={(e) =>
                    handleColorChange("accentColor", e.target.value)
                  }
                  type="color"
                  value={appearance.accentColor}
                />
                <input
                  onChange={(e) =>
                    handleColorChange("accentColor", e.target.value)
                  }
                  type="text"
                  value={appearance.accentColor}
                />
              </div>
            </ThemeField>
            <ThemeField label={t("settings.appearance.background")}>
              <div className="ref-appearance-color-control">
                <input
                  onChange={(e) =>
                    handleColorChange("backgroundColor", e.target.value)
                  }
                  type="color"
                  value={appearance.backgroundColor}
                />
                <input
                  onChange={(e) =>
                    handleColorChange("backgroundColor", e.target.value)
                  }
                  type="text"
                  value={appearance.backgroundColor}
                />
              </div>
            </ThemeField>
            <ThemeField label={t("settings.appearance.foreground")}>
              <div className="ref-appearance-color-control">
                <input
                  onChange={(e) =>
                    handleColorChange("foregroundColor", e.target.value)
                  }
                  type="color"
                  value={appearance.foregroundColor}
                />
                <input
                  onChange={(e) =>
                    handleColorChange("foregroundColor", e.target.value)
                  }
                  type="text"
                  value={appearance.foregroundColor}
                />
              </div>
            </ThemeField>
            <ThemeField label={t("settings.appearance.fontTitle")}>
              <div className="ref-appearance-select-stack">
                <VoidSelect
                  ariaLabel={t("settings.appearance.fontTitle")}
                  onChange={(next) =>
                    patch({ uiFontPreset: next as UiFontPresetId })
                  }
                  options={uiFonts.map((font) => ({
                    label: font.label,
                    value: font.id,
                  }))}
                  value={appearance.uiFontPreset}
                  variant="compact"
                />
                <span className="ref-appearance-inline-code">
                  {
                    uiFonts.find((item) => item.id === appearance.uiFontPreset)
                      ?.stack
                  }
                </span>
              </div>
            </ThemeField>
            <ThemeField label={t("settings.appearance.codeFontTitle")}>
              <div className="ref-appearance-select-stack">
                <VoidSelect
                  ariaLabel={t("settings.appearance.codeFontTitle")}
                  onChange={(next) =>
                    patch({ codeFontPreset: next as CodeFontPresetId })
                  }
                  options={codeFonts.map((font) => ({
                    label: font.label,
                    value: font.id,
                  }))}
                  value={appearance.codeFontPreset}
                  variant="compact"
                />
                <span className="ref-appearance-inline-code">
                  {
                    codeFonts.find(
                      (item) => item.id === appearance.codeFontPreset
                    )?.stack
                  }
                </span>
              </div>
            </ThemeField>
            <ThemeField label={t("settings.appearance.translucentSidebar")}>
              <button
                aria-checked={appearance.translucentSidebar}
                className={`ref-settings-toggle ${appearance.translucentSidebar ? "is-on" : ""}`}
                onClick={() =>
                  patchChrome({
                    translucentSidebar: !appearance.translucentSidebar,
                  })
                }
                role="switch"
                type="button"
              >
                <span className="ref-settings-toggle-knob" />
              </button>
            </ThemeField>
            <ThemeField label={t("settings.appearance.contrast")}>
              <div className="ref-appearance-range-wrap">
                <input
                  max={100}
                  min={0}
                  onChange={(e) =>
                    patchChrome({
                      contrast: clamp(Number(e.target.value), 0, 100),
                    })
                  }
                  type="range"
                  value={appearance.contrast}
                />
                <span>{appearance.contrast}</span>
              </div>
            </ThemeField>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="appearance-pointer-heading"
        className="ref-settings-agent-section"
      >
        <div className="ref-appearance-subcard">
          <ThemeField
            description={t("settings.appearance.pointerCursorDesc")}
            label={t("settings.appearance.pointerCursorTitle")}
          >
            <button
              aria-checked={appearance.usePointerCursors}
              className={`ref-settings-toggle ${appearance.usePointerCursors ? "is-on" : ""}`}
              onClick={() =>
                patch({ usePointerCursors: !appearance.usePointerCursors })
              }
              role="switch"
              type="button"
            >
              <span className="ref-settings-toggle-knob" />
            </button>
          </ThemeField>
        </div>
      </section>

      <section
        aria-labelledby="appearance-size-heading"
        className="ref-settings-agent-section"
      >
        <div className="ref-appearance-subcard">
          <ThemeField
            description={t("settings.appearance.uiFontSizeDesc")}
            label={t("settings.appearance.uiFontSize")}
          >
            <div className="ref-appearance-number-control">
              <input
                max={18}
                min={11}
                onChange={(e) =>
                  patch({
                    uiFontSize: clamp(
                      Number(e.target.value) || appearance.uiFontSize,
                      11,
                      18
                    ),
                  })
                }
                type="number"
                value={appearance.uiFontSize}
              />
              <span>px</span>
            </div>
          </ThemeField>
          <ThemeField
            description={t("settings.appearance.codeFontSizeDesc")}
            label={t("settings.appearance.codeFontSize")}
          >
            <div className="ref-appearance-number-control">
              <input
                max={18}
                min={11}
                onChange={(e) =>
                  patch({
                    codeFontSize: clamp(
                      Number(e.target.value) || appearance.codeFontSize,
                      11,
                      18
                    ),
                  })
                }
                type="number"
                value={appearance.codeFontSize}
              />
              <span>px</span>
            </div>
          </ThemeField>
        </div>
      </section>
    </div>
  );
}
