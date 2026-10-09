'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ConsentFieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    children?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    name?: string;
}
export function ConsentField({ label, checked, onCheckedChange, children, required = true, disabled, name, className, ...props }: ConsentFieldProps) { const id = useId(); return <div {...props} className={cx('md-consent-field', className)}><label htmlFor={id}><input id={id} type="checkbox" name={name} required={required} disabled={disabled} checked={checked} aria-describedby={children ? `${id}-terms` : undefined} onChange={event => onCheckedChange(event.target.checked)}/>{label}{required && <span aria-hidden="true"> *</span>}</label>{children && <div id={`${id}-terms`} className="md-muted">{children}</div>}</div>; }
