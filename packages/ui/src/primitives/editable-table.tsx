'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface EditableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    value: readonly (Record<string, string> & {
        id: string;
    })[];
    onValueChange: (rows: (Record<string, string> & {
        id: string;
    })[]) => void;
    disabled?: boolean;
}
export function EditableTable({ caption, columns, value, onValueChange, disabled, className, ...props }: EditableTableProps) { return <div {...props} className={cx('md-table-wrap', className)} role="region" aria-label={caption} tabIndex={0}><table className="md-table"><caption>{caption}</caption><thead><tr>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{value.map(row => <tr key={row.id}>{columns.map(column => <td key={column.key}><input className="md-input" aria-label={`${column.label}, ligne ${row.id}`} disabled={disabled || column.key === 'id'} value={row[column.key] ?? ''} onChange={event => { if (column.key !== 'id')
    onValueChange(value.map(item => item.id === row.id ? { ...item, [column.key]: event.target.value } : item)); }}/></td>)}</tr>)}{!value.length && <tr><td colSpan={Math.max(1, columns.length)}>Aucune ligne.</td></tr>}</tbody></table></div>; }
