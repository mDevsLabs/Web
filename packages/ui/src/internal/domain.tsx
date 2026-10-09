'use client';
import { useId, useMemo, useState, type FormEvent, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from './utils.js';
export interface DomainField {
    key: string;
    label: string;
    kind: 'text' | 'email' | 'url' | 'date' | 'number' | 'status';
    required?: boolean;
    options?: readonly string[];
}
export interface DomainConfig {
    name: string;
    label: string;
    description: string;
    fields: readonly DomainField[];
    titleKey: string;
    settings: readonly {
        key: string;
        label: string;
        description: string;
    }[];
}
export type DomainRecord = Record<string, string | number | undefined>;
export interface DomainActivity {
    id: string;
    title: string;
    description?: string;
    date: string;
}
export interface DomainMetric {
    id: string;
    label: string;
    value: string | number;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
export interface DomainFrameProps extends HTMLAttributes<HTMLElement> {
    title?: string;
    description?: string;
    actions?: ReactNode;
}
const format = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value);
function Frame({ config, title, description, actions, className, children, ...props }: DomainFrameProps & {
    config: DomainConfig;
}) {
    const id = useId();
    return <section {...props} className={cx('md-glass md-domain', className)} aria-labelledby={props['aria-label'] ? undefined : id}>
    <header className="md-domain-heading"><div><h3 id={id}>{title ?? config.label}</h3>{(description ?? config.description) && <p className="md-muted">{description ?? config.description}</p>}</div>{actions && <div>{actions}</div>}</header>{children}
  </section>;
}
export function DomainCard({ config, item, ...props }: DomainFrameProps & {
    config: DomainConfig;
    item: DomainRecord;
}) {
    return <Frame config={config} {...props} title={props.title ?? format(item[config.titleKey])}>
    <dl className="md-description-list">{config.fields.filter(f => f.key !== config.titleKey).map(f => <div key={f.key}><dt>{f.label}</dt><dd>{f.kind === 'status' ? <span className="md-badge">{format(item[f.key])}</span> : format(item[f.key])}</dd></div>)}</dl>
  </Frame>;
}
export function DomainList({ config, items, onSelect, emptyMessage = 'Aucun élément.', ...props }: Omit<DomainFrameProps, 'onSelect'> & {
    config: DomainConfig;
    items: readonly DomainRecord[];
    onSelect?: (item: DomainRecord) => void;
    emptyMessage?: string;
}) {
    return <Frame config={config} {...props}>{items.length ? <ul className="md-item-list">{items.map((item, i) => <li key={item.id ?? i}>{onSelect ? <button type="button" className="md-list-action" onClick={() => onSelect(item)}><strong>{format(item[config.titleKey])}</strong><span className="md-muted">{config.fields.filter(f => f.key !== config.titleKey).map(f => format(item[f.key])).join(' · ')}</span></button> : <div><strong>{format(item[config.titleKey])}</strong><p className="md-muted">{config.fields.filter(f => f.key !== config.titleKey).map(f => format(item[f.key])).join(' · ')}</p></div>}</li>)}</ul> : <p className="md-muted">{emptyMessage}</p>}</Frame>;
}
export function DomainTable({ config, items, emptyMessage = 'Aucun élément.', ...props }: DomainFrameProps & {
    config: DomainConfig;
    items: readonly DomainRecord[];
    emptyMessage?: string;
}) {
    const [sort, setSort] = useState<{
        key: string;
        ascending: boolean;
    } | null>(null);
    const ordered = useMemo(() => sort ? [...items].sort((a, b) => { const x = a[sort.key], y = b[sort.key]; const n = typeof x === 'number' && typeof y === 'number' ? x - y : format(x).localeCompare(format(y), undefined, { numeric: true }); return sort.ascending ? n : -n; }) : items, [items, sort]);
    return <Frame config={config} {...props}><div className="md-table-scroll" role="region" aria-label={`Tableau : ${props.title ?? config.label}`} tabIndex={0}><table className="md-table"><caption className="md-sr-only">{props.title ?? config.label}</caption><thead><tr>{config.fields.map(f => <th key={f.key} scope="col" aria-sort={sort?.key === f.key ? sort.ascending ? 'ascending' : 'descending' : 'none'}><button type="button" className="md-sort" onClick={() => setSort({ key: f.key, ascending: sort?.key === f.key ? !sort.ascending : true })}>{f.label}<span aria-hidden="true">{sort?.key === f.key ? sort.ascending ? ' ↑' : ' ↓' : ' ↕'}</span></button></th>)}</tr></thead><tbody>{ordered.length ? ordered.map((item, i) => <tr key={item.id ?? i}>{config.fields.map(f => <td key={f.key}>{format(item[f.key])}</td>)}</tr>) : <tr><td colSpan={config.fields.length}>{emptyMessage}</td></tr>}</tbody></table></div></Frame>;
}
export function DomainForm({ config, initialValues, onSubmit, submitLabel = 'Enregistrer', pending = false, ...props }: Omit<DomainFrameProps, 'onSubmit'> & {
    config: DomainConfig;
    initialValues?: DomainRecord;
    onSubmit: (value: DomainRecord) => void;
    submitLabel?: string;
    pending?: boolean;
}) {
    const id = useId();
    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const values: DomainRecord = {};
        for (const field of config.fields) {
            const raw = String(data.get(field.key) ?? '').trim();
            values[field.key] = field.kind === 'number' ? raw === '' ? undefined : Number(raw) : raw;
        }
        onSubmit(values);
    }
    return <Frame config={config} {...props}><form className="md-form-grid" onSubmit={submit} aria-busy={pending}><fieldset disabled={pending} className="md-fieldset"><legend className="md-sr-only">{props.title ?? config.label}</legend>{config.fields.map(f => <div className="md-field" key={f.key}><label htmlFor={`${id}-${f.key}`}>{f.label}{f.required && <span aria-hidden="true"> *</span>}</label>{f.kind === 'status' ? <select id={`${id}-${f.key}`} name={f.key} className="md-input" defaultValue={initialValues?.[f.key] ?? f.options?.[0]} required={f.required}>{f.options?.map(o => <option key={o} value={o}>{o}</option>)}</select> : <input className="md-input" id={`${id}-${f.key}`} name={f.key} type={f.kind} step={f.kind === 'number' ? 'any' : undefined} defaultValue={initialValues?.[f.key]} required={f.required}/>}</div>)}</fieldset><button className="md-button" type="submit" disabled={pending}>{pending ? 'Enregistrement…' : submitLabel}</button></form></Frame>;
}
export function DomainFilters({ config, query, status, onQueryChange, onStatusChange, ...props }: DomainFrameProps & {
    config: DomainConfig;
    query: string;
    status?: string;
    onQueryChange: (value: string) => void;
    onStatusChange?: (value: string) => void;
}) {
    const id = useId();
    const field = config.fields.find(f => f.kind === 'status');
    return <Frame config={config} {...props}><div className="md-filter-bar"><div className="md-field"><label htmlFor={`${id}-query`}>Rechercher</label><input className="md-input" id={`${id}-query`} type="search" value={query} onChange={e => onQueryChange(e.target.value)}/></div>{field && <div className="md-field"><label htmlFor={`${id}-status`}>{field.label}</label><select className="md-input" id={`${id}-status`} value={status ?? ''} onChange={e => onStatusChange?.(e.target.value)} disabled={!onStatusChange}><option value="">Tous les statuts</option>{field.options?.map(o => <option key={o}>{o}</option>)}</select></div>}<button type="button" className="md-button md-button-ghost" onClick={() => { onQueryChange(''); onStatusChange?.(''); }}>Réinitialiser</button></div></Frame>;
}
export function DomainTimeline({ config, events, emptyMessage = 'Aucune activité.', ...props }: DomainFrameProps & {
    config: DomainConfig;
    events: readonly DomainActivity[];
    emptyMessage?: string;
}) {
    return <Frame config={config} {...props}>{events.length ? <ol className="md-timeline">{events.map(event => <li key={event.id}><span className="md-timeline-dot" aria-hidden="true"/><div><strong>{event.title}</strong>{event.description && <p>{event.description}</p>}<time dateTime={event.date} className="md-muted">{event.date}</time></div></li>)}</ol> : <p className="md-muted">{emptyMessage}</p>}</Frame>;
}
export function DomainStats({ config, metrics, ...props }: DomainFrameProps & {
    config: DomainConfig;
    metrics: readonly DomainMetric[];
}) {
    return <Frame config={config} {...props}><dl className="md-stat-grid">{metrics.map(metric => <div key={metric.id} className="md-stat" data-tone={metric.tone}><dt>{metric.label}</dt><dd>{metric.value}</dd>{metric.change && <p>{metric.change}</p>}</div>)}</dl></Frame>;
}
export function DomainEmptyState({ config, message = 'Les éléments apparaîtront ici une fois créés.', actionLabel, onAction, ...props }: DomainFrameProps & {
    config: DomainConfig;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return <Frame config={config} {...props}><div className="md-empty"><span className="md-empty-mark" aria-hidden="true">◇</span><p>{message}</p>{onAction && actionLabel && <button className="md-button" type="button" onClick={onAction}>{actionLabel}</button>}</div></Frame>;
}
export function DomainSettings({ config, values, onChange, ...props }: Omit<DomainFrameProps, 'onChange'> & {
    config: DomainConfig;
    values: Record<string, boolean | undefined>;
    onChange: (key: string, value: boolean) => void;
}) {
    const id = useId();
    return <Frame config={config} {...props}><div className="md-settings">{config.settings.map(setting => <div className="md-setting" key={setting.key}><div><label htmlFor={`${id}-${setting.key}`}>{setting.label}</label><p className="md-muted" id={`${id}-${setting.key}-hint`}>{setting.description}</p></div><input className="md-switch-native" type="checkbox" role="switch" id={`${id}-${setting.key}`} aria-describedby={`${id}-${setting.key}-hint`} checked={Boolean(values[setting.key])} onChange={e => onChange(setting.key, e.target.checked)}/></div>)}</div></Frame>;
}
export function DomainOverview({ config, items, metrics, ...props }: DomainFrameProps & {
    config: DomainConfig;
    items: readonly DomainRecord[];
    metrics: readonly DomainMetric[];
}) {
    return <Frame config={config} {...props}><dl className="md-stat-grid">{metrics.map(m => <div className="md-stat" key={m.id}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl><ul className="md-item-list">{items.slice(0, 5).map((item, i) => <li key={item.id ?? i}><strong>{format(item[config.titleKey])}</strong><p className="md-muted">{config.fields.filter(f => f.key !== config.titleKey).slice(0, 2).map(f => format(item[f.key])).join(' · ')}</p></li>)}</ul>{items.length === 0 && <p className="md-muted">Aucun élément.</p>}</Frame>;
}
