import { type CSSProperties, useMemo } from "react";
import type { TFunction } from "../../i18n";
import {
  applyTerminalDisplayPreset,
  FONT_FAMILY_CHOICES,
  type TerminalAppSettings,
  type TerminalDisplayPresetId,
} from "../terminalSettings";
import {
  ChipGroup,
  ChipToggle,
  Field,
  NumberRow,
  SettingsSection,
  ToggleSwitch,
} from "./SettingsFormElements";
import { matchesDisplayPreset } from "./profilesUtils";

export function AppearanceSettingsStage({
  t,
  settings,
  onPatchSettings,
}: {
  t: TFunction;
  settings: TerminalAppSettings;
  onPatchSettings(partial: Partial<TerminalAppSettings>): void;
}) {
  const previewStyle = useMemo(
    (): CSSProperties => ({
      fontFamily: settings.fontFamily,
      fontSize: `${settings.fontSize}px`,
      fontWeight: settings.fontWeight,
      lineHeight: String(settings.lineHeight),
      opacity: settings.opacity,
    }),
    [
      settings.fontFamily,
      settings.fontSize,
      settings.fontWeight,
      settings.lineHeight,
      settings.opacity,
    ]
  );

  return (
    <div className="ref-uterm-settings-page">
      <div className="ref-uterm-settings-page-head">
        <div>
          <h2 className="ref-uterm-settings-page-title">
            {t("app.universalTerminalSettings.nav.appearance")}
          </h2>
          <p className="ref-uterm-settings-page-copy">
            {t("app.universalTerminalSettings.appearanceLead")}
          </p>
        </div>
      </div>

      <div className="ref-uterm-settings-sections">
        <SettingsSection
          description={t("app.universalTerminalSettings.displayPresets.hint")}
          title={t("app.universalTerminalSettings.displayPresets.title")}
        >
          <div
            className="ref-uterm-settings-preview-shell ref-uterm-settings-preview-shell--block"
            style={previewStyle}
          >
            <div className="ref-uterm-settings-preview-shell-top">
              <span>{t("app.universalTerminalSettings.preview.target")}</span>
              <span>
                {t("app.universalTerminalSettings.preview.connected")}
              </span>
            </div>
            <div className="ref-uterm-settings-preview-shell-body">
              <div>
                <span className="ref-uterm-settings-preview-prompt">$</span>npm
                run dev
              </div>
              <div className="is-dim">ready in 842ms</div>
              <div>
                <span className="ref-uterm-settings-preview-prompt">$</span>git
                status --short
              </div>
            </div>
          </div>
          <ChipGroup>
            {(
              [
                "compact",
                "balanced",
                "presentation",
              ] as TerminalDisplayPresetId[]
            ).map((presetId) => (
              <ChipToggle
                active={matchesDisplayPreset(settings, presetId)}
                key={presetId}
                onClick={() =>
                  onPatchSettings(
                    applyTerminalDisplayPreset(settings, presetId)
                  )
                }
              >
                {t(`app.universalTerminalSettings.displayPresets.${presetId}`)}
              </ChipToggle>
            ))}
          </ChipGroup>
        </SettingsSection>

        <SettingsSection
          title={t("app.universalTerminalSettings.appearanceTypography")}
        >
          <div className="ref-uterm-settings-form">
            <Field label={t("app.universalTerminalSettings.fontFamily")}>
              <select
                className="ref-uterm-settings-select"
                onChange={(event) =>
                  onPatchSettings({ fontFamily: event.target.value })
                }
                value={settings.fontFamily}
              >
                {FONT_FAMILY_CHOICES.map((font) => (
                  <option key={font.label} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("app.universalTerminalSettings.fontSize")}>
              <NumberRow
                max={32}
                min={8}
                onChange={(next) => onPatchSettings({ fontSize: next })}
                step={1}
                value={settings.fontSize}
              />
            </Field>
            <Field label={t("app.universalTerminalSettings.fontWeight")}>
              <NumberRow
                max={900}
                min={100}
                onChange={(next) =>
                  onPatchSettings({ fontWeight: Math.round(next / 100) * 100 })
                }
                step={100}
                value={settings.fontWeight}
              />
            </Field>
            <Field label={t("app.universalTerminalSettings.fontWeightBold")}>
              <NumberRow
                max={900}
                min={100}
                onChange={(next) =>
                  onPatchSettings({
                    fontWeightBold: Math.round(next / 100) * 100,
                  })
                }
                step={100}
                value={settings.fontWeightBold}
              />
            </Field>
            <Field label={t("app.universalTerminalSettings.lineHeight")}>
              <NumberRow
                max={2.4}
                min={1}
                onChange={(next) => onPatchSettings({ lineHeight: next })}
                step={0.05}
                value={settings.lineHeight}
              />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("app.universalTerminalSettings.appearanceCanvas")}
        >
          <div className="ref-uterm-settings-form">
            <Field label={t("app.universalTerminalSettings.cursorStyle")}>
              <ChipGroup>
                {(["bar", "block", "underline"] as const).map((style) => (
                  <ChipToggle
                    active={settings.cursorStyle === style}
                    key={style}
                    onClick={() => onPatchSettings({ cursorStyle: style })}
                  >
                    {t(`app.universalTerminalSettings.cursor.${style}`)}
                  </ChipToggle>
                ))}
              </ChipGroup>
            </Field>
            <Field label={t("app.universalTerminalSettings.cursorBlink")}>
              <ToggleSwitch
                checked={settings.cursorBlink}
                onChange={(next) => onPatchSettings({ cursorBlink: next })}
              />
            </Field>
            <Field label={t("app.universalTerminalSettings.opacity")}>
              <div className="ref-uterm-settings-slider">
                <input
                  max={1}
                  min={0.6}
                  onChange={(event) =>
                    onPatchSettings({ opacity: Number(event.target.value) })
                  }
                  step={0.02}
                  type="range"
                  value={settings.opacity}
                />
                <span className="ref-uterm-settings-slider-value">
                  {Math.round(settings.opacity * 100)}%
                </span>
              </div>
            </Field>
            <Field
              hint={t("app.universalTerminalSettings.minimumContrastRatioHint")}
              label={t("app.universalTerminalSettings.minimumContrastRatio")}
            >
              <NumberRow
                max={21}
                min={1}
                onChange={(next) =>
                  onPatchSettings({
                    minimumContrastRatio: Number(next.toFixed(1)),
                  })
                }
                step={0.5}
                value={settings.minimumContrastRatio}
              />
            </Field>
            <Field
              label={t(
                "app.universalTerminalSettings.drawBoldTextInBrightColors"
              )}
            >
              <ToggleSwitch
                checked={settings.drawBoldTextInBrightColors}
                onChange={(next) =>
                  onPatchSettings({ drawBoldTextInBrightColors: next })
                }
              />
            </Field>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
