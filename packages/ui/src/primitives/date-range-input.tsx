'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface DateRangeInputProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: {
        start: string;
        end: string;
    };
    onValueChange: (value: {
        start: string;
        end: string;
    }) => void;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
}
export function DateRangeInput({ label, value, onValueChange, min, max, required, disabled, className, ...props }: DateRangeInputProps) { const id = useId(); return <div {...props} className={className}><fieldset className="md-form-section" disabled={disabled}><legend>{label}</legend><div className="md-grid"><label className="md-field" htmlFor={`${id}-start`}>Début<input id={`${id}-start`} className="md-input" type="date" value={value.start} min={min} max={value.end || max} required={required} onChange={event => onValueChange({ ...value, start: event.target.value })}/></label><label className="md-field" htmlFor={`${id}-end`}>Fin<input id={`${id}-end`} className="md-input" type="date" value={value.end} min={value.start || min} max={max} required={required} onChange={event => onValueChange({ ...value, end: event.target.value })}/></label></div></fieldset></div>; }
