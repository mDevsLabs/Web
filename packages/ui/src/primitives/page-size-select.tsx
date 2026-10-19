'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PageSizeSelectProps extends HTMLAttributes<HTMLDivElement> {
    value: number;
    onValueChange: (size: number) => void;
    options?: readonly number[];
    label?: string;
    disabled?: boolean;
}
export function PageSizeSelect({ value, onValueChange, options = [10, 25, 50, 100], label = 'Lignes par page', disabled, className, ...props }: PageSizeSelectProps) { const id = useId(); const sizes = [...new Set(options)].filter(size => Number.isInteger(size) && size > 0); return <div {...props} className={cx('md-field md-page-size', className)}><label htmlFor={id}>{label}</label><select id={id} className="md-select" value={value} disabled={disabled} onChange={event => onValueChange(Number(event.target.value))}>{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select></div>; }
