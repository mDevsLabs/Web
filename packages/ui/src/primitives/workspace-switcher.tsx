'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface WorkspaceSwitcherProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    workspaces: readonly {
        id: string;
        name: string;
        description?: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (id: string) => void;
    disabled?: boolean;
}
export function WorkspaceSwitcher({ label, workspaces, value, onValueChange, disabled, className, ...props }: WorkspaceSwitcherProps) { const id = useId(); const current = workspaces.find(workspace => workspace.id === value); return <div {...props} className={cx('md-field md-workspace-switcher', className)}><label htmlFor={id}>{label}</label><select id={id} className="md-select" value={value} disabled={disabled} aria-describedby={current?.description ? `${id}-description` : undefined} onChange={event => onValueChange(event.target.value)}>{workspaces.map(workspace => <option key={workspace.id} value={workspace.id} disabled={workspace.disabled}>{workspace.name}</option>)}</select>{current?.description && <p id={`${id}-description`} className="md-muted">{current.description}</p>}</div>; }
