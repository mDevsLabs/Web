'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface MultiSelectProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    disabled?: boolean;
}
export function MultiSelect({ label, options, value, onValueChange, disabled, className, ...props }: MultiSelectProps) { const id = useId(); return <div {...props} className={cx('md-multi-select', className)}><fieldset disabled={disabled} className="md-form-section"><legend>{label}</legend><p id={id} className="md-muted">{value.length} choix sélectionné(s)</p><div className="md-choice-list">{options.map(option => <label key={option.value}><input type="checkbox" disabled={option.disabled} checked={value.includes(option.value)} aria-describedby={id} onChange={event => onValueChange(event.target.checked ? [...value, option.value] : value.filter(item => item !== option.value))}/>{option.label}</label>)}</div></fieldset></div>; }
