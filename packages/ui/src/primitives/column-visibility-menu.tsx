'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ColumnVisibilityMenuProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    columns: readonly {
        key: string;
        label: string;
        required?: boolean;
    }[];
    visibleKeys: readonly string[];
    onVisibilityChange: (keys: string[]) => void;
}
export function ColumnVisibilityMenu({ label, columns, visibleKeys, onVisibilityChange, className, ...props }: ColumnVisibilityMenuProps) { return <div {...props} className={cx('md-column-menu', className)}><details><summary>{label}</summary><fieldset className="md-form-section"><legend>Colonnes visibles</legend>{columns.map(column => <label key={column.key} className="md-choice-row"><input type="checkbox" checked={!!column.required || visibleKeys.includes(column.key)} disabled={column.required} onChange={event => onVisibilityChange(event.target.checked ? [...new Set([...visibleKeys, column.key])] : visibleKeys.filter(key => key !== column.key))}/>{column.label}</label>)}</fieldset></details></div>; }
