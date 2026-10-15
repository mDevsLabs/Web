import type { ReactNode } from "react";
import { TERMINAL_COLOR_SCHEMES } from "../terminalSettings";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="ref-uterm-settings-field">
      <div>
        <div className="ref-uterm-settings-label">{label}</div>
        {hint ? <p className="ref-uterm-settings-hint">{hint}</p> : null}
      </div>
      <div className="ref-uterm-settings-control">{children}</div>
    </div>
  );
}

export function FieldStack({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="ref-uterm-settings-fieldstack">
      <div className="ref-uterm-settings-label">{label}</div>
      {hint ? <p className="ref-uterm-settings-hint">{hint}</p> : null}
      <div>{children}</div>
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange(next: boolean): void;
}) {
  return (
    <button
      aria-checked={checked}
      className={`ref-uterm-settings-toggle ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="ref-uterm-settings-toggle-thumb" />
    </button>
  );
}

export function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange(next: boolean): void;
}) {
  return (
    <div className="ref-uterm-settings-toggle-field">
      <div>
        <div className="ref-uterm-settings-label">{label}</div>
        {hint ? <p className="ref-uterm-settings-hint">{hint}</p> : null}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="ref-uterm-settings-section">
      <h3 className="ref-uterm-settings-section-title">{title}</h3>
      {description ? (
        <p className="ref-uterm-settings-section-copy">{description}</p>
      ) : null}
      <div className="ref-uterm-settings-section-body">{children}</div>
    </section>
  );
}

export function ColorSchemeList({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect(colorSchemeId: string): void;
}) {
  return (
    <div className="ref-uterm-settings-color-list">
      {TERMINAL_COLOR_SCHEMES.map((scheme) => (
        <button
          className={`ref-uterm-settings-color-card ${selectedId === scheme.id ? "is-active" : ""}`}
          key={scheme.id}
          onClick={() => onSelect(scheme.id)}
          type="button"
        >
          <div className="ref-uterm-settings-color-card-title">
            {scheme.name}
          </div>
          <div
            className="ref-uterm-settings-color-preview"
            style={{
              backgroundColor: scheme.background,
              color: scheme.foreground,
            }}
          >
            <div>
              <span style={{ color: scheme.colors[2] }}>john</span>
              <span style={{ color: scheme.colors[6] }}>@</span>
              <span style={{ color: scheme.colors[4] }}>host</span>
              <strong style={{ color: scheme.colors[1] }}> $</strong>
              <span> ls</span>
            </div>
            <div>
              <span>-rwxr-xr-x 1 root </span>
              <strong style={{ color: scheme.colors[3] }}>Documents</strong>
            </div>
            <div>
              <span>-rwxr-xr-x 1 root </span>
              <strong style={{ color: scheme.colors[12] }}>Music</strong>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function SubtabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick(): void;
  label: string;
}) {
  return (
    <button
      aria-selected={active}
      className={`ref-uterm-settings-subtab ${active ? "is-active" : ""}`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
    </button>
  );
}

export function NumberRow({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange(next: number): void;
}) {
  return (
    <div className="ref-uterm-settings-numberrow">
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <input
        className="ref-uterm-settings-numberinput"
        max={max}
        min={min}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) {
            onChange(next);
          }
        }}
        step={step}
        type="number"
        value={value}
      />
    </div>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <div className="ref-uterm-settings-chip-row">{children}</div>;
}

export function ChipToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      className={`ref-uterm-settings-chip ${active ? "is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
