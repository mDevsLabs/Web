'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ComparisonTableProps extends HTMLAttributes<HTMLDivElement> {
    caption: string;
    columns: readonly {
        id: string;
        label: string;
    }[];
    features: readonly {
        id: string;
        label: string;
        values: Readonly<Record<string, string | number | boolean>>;
    }[];
}
export function ComparisonTable({ caption, columns, features, className, ...props }: ComparisonTableProps) { return <div {...props} className={cx('md-table-wrap', className)} role="region" aria-label={caption} tabIndex={0}><table className="md-table"><caption>{caption}</caption><thead><tr><th scope="col">Fonctionnalité</th>{columns.map(column => <th scope="col" key={column.id}>{column.label}</th>)}</tr></thead><tbody>{features.map(feature => <tr key={feature.id}><th scope="row">{feature.label}</th>{columns.map(column => <td key={column.id}>{typeof feature.values[column.id] === 'boolean' ? (feature.values[column.id] ? 'Inclus' : 'Non inclus') : feature.values[column.id] ?? '—'}</td>)}</tr>)}</tbody></table></div>; }
