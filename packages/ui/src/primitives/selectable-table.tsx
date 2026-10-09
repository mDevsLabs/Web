'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SelectableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    rows: readonly (Record<string, string | number> & {
        id: string;
    })[];
    selectedIds: readonly string[];
    onSelectionChange: (ids: string[]) => void;
}
export function SelectableTable({ caption, columns, rows, selectedIds, onSelectionChange, className, ...props }: SelectableTableProps) { const all = useRef<HTMLInputElement>(null); const count = rows.filter(row => selectedIds.includes(row.id)).length; useEffect(() => { if (all.current)
    all.current.indeterminate = count > 0 && count < rows.length; }, [count, rows.length]); const selectPage = (checked: boolean) => onSelectionChange(checked ? [...new Set([...selectedIds, ...rows.map(row => row.id)])] : selectedIds.filter(id => !rows.some(row => row.id === id))); return <div {...props} className={cx('md-table-wrap', className)} tabIndex={0} role="region" aria-label={caption}><table className="md-table"><caption>{caption}</caption><thead><tr><th scope="col"><input ref={all} type="checkbox" aria-label="Sélectionner les lignes de cette page" disabled={!rows.length} checked={!!rows.length && count === rows.length} onChange={event => selectPage(event.target.checked)}/></th>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} data-selected={selectedIds.includes(row.id) || undefined}><td><input type="checkbox" aria-label={`Sélectionner la ligne ${row.id}`} checked={selectedIds.includes(row.id)} onChange={event => onSelectionChange(event.target.checked ? [...selectedIds, row.id] : selectedIds.filter(id => id !== row.id))}/></td>{columns.map(column => <td key={column.key}>{row[column.key]}</td>)}</tr>)}{!rows.length && <tr><td colSpan={columns.length + 1}>Aucune ligne.</td></tr>}</tbody></table></div>; }
