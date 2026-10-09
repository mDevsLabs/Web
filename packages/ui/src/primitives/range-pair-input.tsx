'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface RangePairInputProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly [
        number,
        number
    ];
    onValueChange: (value: [
        number,
        number
    ]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}
export function RangePairInput({ label, value, onValueChange, min = 0, max = 100, step = 1, disabled, className, ...props }: RangePairInputProps) { const id = useId(); const upper = Math.max(min, max); const low = Math.max(min, Math.min(upper, Number.isFinite(value[0]) ? value[0] : min)); const high = Math.max(low, Math.min(upper, Number.isFinite(value[1]) ? value[1] : upper)); return <div {...props} className={className}><fieldset className="md-form-section" disabled={disabled}><legend>{label}</legend><label htmlFor={`${id}-low`}>Minimum : {low}<input id={`${id}-low`} type="range" className="md-range" min={min} max={high} step={step > 0 ? step : 1} value={low} onChange={event => onValueChange([event.target.valueAsNumber, high])}/></label><label htmlFor={`${id}-high`}>Maximum : {high}<input id={`${id}-high`} type="range" className="md-range" min={low} max={upper} step={step > 0 ? step : 1} value={high} onChange={event => onValueChange([low, event.target.valueAsNumber])}/></label></fieldset></div>; }
