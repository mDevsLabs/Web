import type { TFunction } from "../../i18n";
import type {
  TerminalAppSettings,
  TerminalRightClickAction,
} from "../terminalSettings";
import {
  ChipGroup,
  ChipToggle,
  Field,
  NumberRow,
  SettingsSection,
  ToggleSwitch,
} from "./SettingsFormElements";

export function TerminalBehaviorStage({
  t,
  settings,
  onPatchSettings,
}: {
  t: TFunction;
  settings: TerminalAppSettings;
  onPatchSettings(partial: Partial<TerminalAppSettings>): void;
}) {
  return (
    <div className="ref-uterm-settings-page">
      <div className="ref-uterm-settings-page-head">
        <div>
          <h2 className="ref-uterm-settings-page-title">
            {t("app.universalTerminalSettings.nav.terminal")}
          </h2>
          <p className="ref-uterm-settings-page-copy">
            {t("app.universalTerminalSettings.terminalLead")}
          </p>
        </div>
      </div>

      <div className="ref-uterm-settings-sections">
        <SettingsSection
          title={t("app.universalTerminalSettings.renderingTitle")}
        >
          <div className="ref-uterm-settings-form">
            <Field label={t("app.universalTerminalSettings.scrollback")}>
              <NumberRow
                max={100_000}
                min={100}
                onChange={(next) =>
                  onPatchSettings({ scrollback: Math.floor(next) })
                }
                step={500}
                value={settings.scrollback}
              />
            </Field>
            <Field label={t("app.universalTerminalSettings.scrollOnInput")}>
              <ToggleSwitch
                checked={settings.scrollOnInput}
                onChange={(next) => onPatchSettings({ scrollOnInput: next })}
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

        <SettingsSection title={t("app.universalTerminalSettings.mouseTitle")}>
          <div className="ref-uterm-settings-form">
            <Field label={t("app.universalTerminalSettings.rightClickAction")}>
              <ChipGroup>
                {(
                  [
                    "off",
                    "menu",
                    "paste",
                    "clipboard",
                  ] as TerminalRightClickAction[]
                ).map((action) => (
                  <ChipToggle
                    active={settings.rightClickAction === action}
                    key={action}
                    onClick={() =>
                      onPatchSettings({ rightClickAction: action })
                    }
                  >
                    {t(`app.universalTerminalSettings.rightClick.${action}`)}
                  </ChipToggle>
                ))}
              </ChipGroup>
            </Field>
            <Field
              label={t("app.universalTerminalSettings.pasteOnMiddleClick")}
            >
              <ToggleSwitch
                checked={settings.pasteOnMiddleClick}
                onChange={(next) =>
                  onPatchSettings({ pasteOnMiddleClick: next })
                }
              />
            </Field>
            <Field
              hint={t("app.universalTerminalSettings.wordSeparatorHint")}
              label={t("app.universalTerminalSettings.wordSeparator")}
            >
              <input
                className="ref-uterm-settings-input"
                onChange={(event) =>
                  onPatchSettings({ wordSeparator: event.target.value })
                }
                type="text"
                value={settings.wordSeparator}
              />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("app.universalTerminalSettings.clipboardTitle")}
        >
          <div className="ref-uterm-settings-form">
            <Field label={t("app.universalTerminalSettings.copyOnSelect")}>
              <ToggleSwitch
                checked={settings.copyOnSelect}
                onChange={(next) => onPatchSettings({ copyOnSelect: next })}
              />
            </Field>
            <Field
              hint={t("app.universalTerminalSettings.bracketedPasteHint")}
              label={t("app.universalTerminalSettings.bracketedPaste")}
            >
              <ToggleSwitch
                checked={settings.bracketedPaste}
                onChange={(next) => onPatchSettings({ bracketedPaste: next })}
              />
            </Field>
            <Field
              hint={t("app.universalTerminalSettings.warnOnMultilinePasteHint")}
              label={t("app.universalTerminalSettings.warnOnMultilinePaste")}
            >
              <ToggleSwitch
                checked={settings.warnOnMultilinePaste}
                onChange={(next) =>
                  onPatchSettings({ warnOnMultilinePaste: next })
                }
              />
            </Field>
            <Field
              hint={t(
                "app.universalTerminalSettings.trimWhitespaceOnPasteHint"
              )}
              label={t("app.universalTerminalSettings.trimWhitespaceOnPaste")}
            >
              <ToggleSwitch
                checked={settings.trimWhitespaceOnPaste}
                onChange={(next) =>
                  onPatchSettings({ trimWhitespaceOnPaste: next })
                }
              />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection title={t("app.universalTerminalSettings.soundTitle")}>
          <div className="ref-uterm-settings-form">
            <Field label={t("app.universalTerminalSettings.bell")}>
              <ChipGroup>
                {(["none", "visual", "audible"] as const).map((style) => (
                  <ChipToggle
                    active={settings.bell === style}
                    key={style}
                    onClick={() => onPatchSettings({ bell: style })}
                  >
                    {t(`app.universalTerminalSettings.bell.${style}`)}
                  </ChipToggle>
                ))}
              </ChipGroup>
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("app.universalTerminalSettings.startupTitle")}
        >
          <div className="ref-uterm-settings-form">
            <Field
              hint={t("app.universalTerminalSettings.autoOpenHint")}
              label={t("app.universalTerminalSettings.autoOpen")}
            >
              <ToggleSwitch
                checked={settings.autoOpen}
                onChange={(next) => onPatchSettings({ autoOpen: next })}
              />
            </Field>
            <Field
              hint={t("app.universalTerminalSettings.restoreTabsHint")}
              label={t("app.universalTerminalSettings.restoreTabs")}
            >
              <ToggleSwitch
                checked={settings.restoreTabs}
                onChange={(next) => onPatchSettings({ restoreTabs: next })}
              />
            </Field>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
