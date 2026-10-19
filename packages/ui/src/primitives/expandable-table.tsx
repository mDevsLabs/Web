'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ExpandableTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        key: string;
        label: string;
    }[];
    rows: readonly (Record<string, string | number> & {
        id: string;
        details: string;
    })[];
    expandedIds: readonly string[];
    onExpandedChange: (ids: string[]) => void;
}
export function ExpandableTable({ caption, columns, rows, expandedIds, onExpandedChange, className, ...props }: ExpandableTableProps) { const id = useId(); return <div {...props} className={cx('md-table-wrap', className)} role="region" aria-label={caption} tabIndex={0}><table className="md-table"><caption>{caption}</caption><thead><tr><th scope="col">Détails</th>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => { const expanded = expandedIds.includes(row.id); return <ReactFragment key={row.id}><tr><td><button type="button" className="md-button md-button-ghost" aria-label={`Détails de la ligne ${row.id}`} aria-expanded={expanded} aria-controls={`${id}-${index}`} onClick={() => onExpandedChange(expanded ? expandedIds.filter(item => item !== row.id) : [...expandedIds, row.id])}>{expanded ? '−' : '+'}</button></td>{columns.map(column => <td key={column.key}>{row[column.key]}</td>)}</tr><tr id={`${id}-${index}`} hidden={!expanded}><td colSpan={columns.length + 1}>{row.details}</td></tr></ReactFragment>; })}{!rows.length && <tr><td colSpan={columns.length + 1}>Aucune ligne.</td></tr>}</tbody></table></div>; }
