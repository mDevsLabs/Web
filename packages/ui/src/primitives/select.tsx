'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, placeholder, className, ...props }, ref) { return <select {...props} ref={ref} className={cx('md-input md-select', className)}>{placeholder && <option value="">{placeholder}</option>}{options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select>; });
