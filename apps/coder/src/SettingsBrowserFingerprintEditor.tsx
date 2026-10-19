import { BROWSER_FINGERPRINT_PRESETS } from "./browserFingerprintPresets.js";
import type { BrowserFingerprintSpoofSettings } from "./browserSidebarConfig.js";
import type { TFunction } from "./i18n";

type Patch = Partial<
  Record<
    keyof BrowserFingerprintSpoofSettings,
    string | number | boolean | undefined
  >
>;

export function BrowserFingerprintEditorFields({
  fp,
  onPatch,
  t,
}: {
  fp: BrowserFingerprintSpoofSettings;
  onPatch: (patch: Patch) => void;
  t: TFunction;
}) {
  return (
    <div className="ref-browser-fp-modal-form">
      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintPresetGroup")}
        </p>
        <p className="ref-browser-fp-micro">
          {t("settings.browser.fingerprintPresetHelp")}
        </p>
        <div
          aria-label={t("settings.browser.fingerprintPresetGroup")}
          className="ref-browser-fp-preset-grid"
          role="group"
        >
          {BROWSER_FINGERPRINT_PRESETS.map((preset) => (
            <button
              className="ref-browser-fp-preset-card"
              key={preset.id}
              onClick={() => onPatch(preset.settings as Patch)}
              title={preset.description}
              type="button"
            >
              <span className="ref-browser-fp-preset-card-label">
                {preset.label}
              </span>
              <span className="ref-browser-fp-preset-card-meta">
                {preset.description}
              </span>
            </button>
          ))}
          <button
            className="ref-browser-fp-preset-card ref-browser-fp-preset-card--reset"
            onClick={() =>
              onPatch({
                availHeightOffset: undefined,
                colorDepth: undefined,
                deviceMemory: undefined,
                devicePixelRatio: undefined,
                hardwareConcurrency: undefined,
                languages: undefined,
                maskWebdriver: undefined,
                platform: undefined,
                screenHeight: undefined,
                screenWidth: undefined,
                timezone: undefined,
                timezoneOffsetMinutes: undefined,
                webglRenderer: undefined,
                webglVendor: undefined,
                webrtcPolicy: undefined,
              })
            }
            title={t("settings.browser.fingerprintPresetClear")}
            type="button"
          >
            <span className="ref-browser-fp-preset-card-label">
              {t("settings.browser.fingerprintPresetClear")}
            </span>
            <span className="ref-browser-fp-preset-card-meta">
              {t("settings.browser.fingerprintPresetClearHint")}
            </span>
          </button>
        </div>
      </div>
      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintGroupIdentity")}
        </p>
        <p className="ref-browser-fp-micro">
          {t("settings.browser.fingerprintPlatformHelp")}
        </p>
        <div
          aria-label={t("settings.browser.fingerprintPlatform")}
          className="ref-browser-fp-seg-grid ref-browser-fp-seg-grid--4"
          role="group"
        >
          {(
            [
              ["", "settings.browser.fingerprintPlatformDefault"],
              ["Win32", "Win32"],
              ["MacIntel", "MacIntel"],
              ["Linux x86_64", "Linux x86_64"],
            ] as const
          ).map(([value, labelKey]) => {
            const cur =
              fp.platform === "MacIntel"
                ? "MacIntel"
                : fp.platform === "Linux x86_64"
                  ? "Linux x86_64"
                  : fp.platform === "Win32"
                    ? "Win32"
                    : "";
            const active = cur === value;
            return (
              <button
                aria-checked={active}
                className={`ref-browser-settings-segment${active ? " is-selected" : ""}`}
                key={value || "default"}
                onClick={() => onPatch({ platform: value || undefined })}
                role="radio"
                type="button"
              >
                <span className="ref-browser-settings-segment-title">
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ref-browser-fp-field ref-browser-fp-field--full">
          <span
            className="ref-browser-fp-field-label"
            id="ref-browser-fp-modal-langs"
          >
            {t("settings.browser.fingerprintLanguages")}
          </span>
          <input
            aria-labelledby="ref-browser-fp-modal-langs"
            className="ref-browser-fp-input"
            onChange={(event) =>
              onPatch({ languages: event.target.value || undefined })
            }
            placeholder="zh-CN, zh, en"
            spellCheck={false}
            type="text"
            value={fp.languages ?? ""}
          />
        </div>
        <div className="ref-browser-fp-grid2">
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintHardware")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              max={128}
              min={1}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({
                  hardwareConcurrency: raw === "" ? undefined : Number(raw),
                });
              }}
              type="number"
              value={fp.hardwareConcurrency ?? ""}
            />
          </div>
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintMemory")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              max={128}
              min={1}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({ deviceMemory: raw === "" ? undefined : Number(raw) });
              }}
              type="number"
              value={fp.deviceMemory ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintGroupScreen")}
        </p>
        <div className="ref-browser-fp-screen-row">
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintWidth")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              max={16_384}
              min={320}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({ screenWidth: raw === "" ? undefined : Number(raw) });
              }}
              type="number"
              value={fp.screenWidth ?? ""}
            />
          </div>
          <span aria-hidden="true" className="ref-browser-fp-times">
            ×
          </span>
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintHeight")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              max={16_384}
              min={240}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({ screenHeight: raw === "" ? undefined : Number(raw) });
              }}
              type="number"
              value={fp.screenHeight ?? ""}
            />
          </div>
        </div>
        <div className="ref-browser-fp-grid2">
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintDpr")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="decimal"
              max={4}
              min={0.5}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({
                  devicePixelRatio: raw === "" ? undefined : Number(raw),
                });
              }}
              step={0.25}
              type="number"
              value={fp.devicePixelRatio ?? ""}
            />
          </div>
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintColorDepth")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              max={48}
              min={8}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({ colorDepth: raw === "" ? undefined : Number(raw) });
              }}
              type="number"
              value={fp.colorDepth ?? ""}
            />
          </div>
        </div>
        <div className="ref-browser-fp-field ref-browser-fp-field--full">
          <span className="ref-browser-fp-field-label">
            {t("settings.browser.fingerprintAvailOffset")}
          </span>
          <input
            className="ref-browser-fp-input ref-browser-fp-input--short"
            inputMode="numeric"
            max={500}
            min={0}
            onChange={(event) => {
              const raw = event.target.value;
              onPatch({
                availHeightOffset: raw === "" ? undefined : Number(raw),
              });
            }}
            placeholder="40"
            type="number"
            value={fp.availHeightOffset ?? ""}
          />
          <span className="ref-browser-fp-hint-inline">
            {t("settings.browser.fingerprintAvailHint")}
          </span>
        </div>
      </div>

      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintGroupTime")}
        </p>
        <div className="ref-browser-fp-field ref-browser-fp-field--full">
          <span className="ref-browser-fp-field-label">
            {t("settings.browser.fingerprintTimezone")}
          </span>
          <input
            className="ref-browser-fp-input"
            onChange={(event) =>
              onPatch({ timezone: event.target.value || undefined })
            }
            placeholder="Asia/Shanghai"
            spellCheck={false}
            type="text"
            value={fp.timezone ?? ""}
          />
        </div>
        <div className="ref-browser-fp-field ref-browser-fp-field--full">
          <span className="ref-browser-fp-field-label">
            {t("settings.browser.fingerprintTzOffset")}
          </span>
          <input
            className="ref-browser-fp-input ref-browser-fp-input--short"
            inputMode="numeric"
            max={840}
            min={-840}
            onChange={(event) => {
              const raw = event.target.value;
              onPatch({
                timezoneOffsetMinutes: raw === "" ? undefined : Number(raw),
              });
            }}
            type="number"
            value={fp.timezoneOffsetMinutes ?? ""}
          />
        </div>
      </div>

      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintGroupWebgl")}
        </p>
        <div className="ref-browser-fp-field ref-browser-fp-field--full">
          <span className="ref-browser-fp-field-label">
            {t("settings.browser.fingerprintWebglVendor")}
          </span>
          <input
            className="ref-browser-fp-input ref-browser-fp-input--mono"
            onChange={(event) =>
              onPatch({ webglVendor: event.target.value || undefined })
            }
            spellCheck={false}
            type="text"
            value={fp.webglVendor ?? ""}
          />
        </div>
        <div className="ref-browser-fp-field ref-browser-fp-field--full">
          <span className="ref-browser-fp-field-label">
            {t("settings.browser.fingerprintWebglRenderer")}
          </span>
          <input
            className="ref-browser-fp-input ref-browser-fp-input--mono"
            onChange={(event) =>
              onPatch({ webglRenderer: event.target.value || undefined })
            }
            spellCheck={false}
            type="text"
            value={fp.webglRenderer ?? ""}
          />
        </div>
      </div>

      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintGroupNoise")}
        </p>
        <div className="ref-browser-fp-grid2">
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintCanvasSeed")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              min={1}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({
                  canvasNoiseSeed: raw === "" ? undefined : Number(raw),
                });
              }}
              type="number"
              value={fp.canvasNoiseSeed ?? ""}
            />
          </div>
          <div className="ref-browser-fp-field">
            <span className="ref-browser-fp-field-label">
              {t("settings.browser.fingerprintAudioSeed")}
            </span>
            <input
              className="ref-browser-fp-input"
              inputMode="numeric"
              min={1}
              onChange={(event) => {
                const raw = event.target.value;
                onPatch({
                  audioNoiseSeed: raw === "" ? undefined : Number(raw),
                });
              }}
              type="number"
              value={fp.audioNoiseSeed ?? ""}
            />
          </div>
        </div>
      </div>

      <div className="ref-browser-fp-group">
        <p className="ref-browser-fp-kicker">
          {t("settings.browser.fingerprintGroupPrivacy")}
        </p>
        <div
          aria-label={t("settings.browser.fingerprintWebrtc")}
          className="ref-browser-fp-seg-grid ref-browser-fp-seg-grid--2"
          role="group"
        >
          {(
            [
              ["default", "settings.browser.fingerprintWebrtcDefault"],
              ["block", "settings.browser.fingerprintWebrtcBlock"],
            ] as const
          ).map(([value, labelKey]) => {
            const active =
              value === "block"
                ? fp.webrtcPolicy === "block"
                : fp.webrtcPolicy !== "block";
            return (
              <button
                aria-checked={active}
                className={`ref-browser-settings-segment${active ? " is-selected" : ""}`}
                key={value}
                onClick={() =>
                  onPatch({
                    webrtcPolicy: value === "block" ? "block" : undefined,
                  })
                }
                role="radio"
                type="button"
              >
                <span className="ref-browser-settings-segment-title">
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
        <label
          aria-label={t("settings.browser.fingerprintMaskWebdriverTitle")}
          className="ref-browser-settings-toggle ref-browser-fp-toggle"
        >
          <input
            checked={fp.maskWebdriver !== false}
            onChange={(event) => {
              if (event.target.checked) {
                onPatch({ maskWebdriver: undefined });
              } else {
                onPatch({ maskWebdriver: false });
              }
            }}
            type="checkbox"
          />
          <span
            aria-hidden="true"
            className="ref-browser-settings-toggle-slider"
          />
          <span className="ref-browser-settings-toggle-copy">
            <strong>
              {t("settings.browser.fingerprintMaskWebdriverTitle")}
            </strong>
            <small>{t("settings.browser.fingerprintMaskWebdriverBody")}</small>
          </span>
        </label>
      </div>
    </div>
  );
}
