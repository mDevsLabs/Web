'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface DataTableColumn<T> {
    key: keyof T & string;
    label: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
    sortable?: boolean;
}
export interface DataTableProps<T> {
    columns: readonly DataTableColumn<T>[];
    rows: readonly T[];
    getRowKey: (row: T) => string;
    caption: string;
    emptyMessage?: string;
    className?: string;
}
export function DataTable<T>({ columns, rows, getRowKey, caption, emptyMessage = 'Aucun résultat.', className }: DataTableProps<T>) { const [sort, setSort] = useState<{
    key: keyof T & string;
    asc: boolean;
} | null>(null); const ordered = useMemo(() => sort ? [...rows].sort((a, b) => { const x = a[sort.key], y = b[sort.key]; const n = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }); return sort.asc ? n : -n; }) : rows, [rows, sort]); return <div className={cx('md-table-scroll', className)} role="region" aria-label={caption} tabIndex={0}><table className="md-table"><caption>{caption}</caption><thead><tr>{columns.map(c => <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? sort.asc ? 'ascending' : 'descending' : undefined}>{c.sortable ? <button type="button" className="md-sort" onClick={() => setSort({ key: c.key, asc: sort?.key === c.key ? !sort.asc : true })}>{c.label}<span aria-hidden="true"> ↕</span></button> : c.label}</th>)}</tr></thead><tbody>{ordered.length ? ordered.map(row => <tr key={getRowKey(row)}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '—')}</td>)}</tr>) : <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody></table></div>; }
