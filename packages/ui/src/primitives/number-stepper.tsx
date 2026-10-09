'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface NumberStepperProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}
export function NumberStepper({ label, value, onValueChange, min = 0, max = 100, step = 1, disabled, className, ...props }: NumberStepperProps) { const id = useId(); const increment = Number.isFinite(step) && step > 0 ? step : 1; const lower = Number.isFinite(min) ? min : 0; const upper = Number.isFinite(max) ? Math.max(lower, max) : 100; const current = Number.isFinite(value) ? Math.min(upper, Math.max(lower, value)) : lower; const change = (next: number) => onValueChange(Math.min(upper, Math.max(lower, next))); return <div {...props} className={cx('md-field', className)}><label htmlFor={id}>{label}</label><div className="md-input-group"><button className="md-button md-button-outline" type="button" aria-label={`Diminuer : ${label}`} disabled={disabled || current <= lower} onClick={() => change(current - increment)}>−</button><input className="md-input" id={id} type="number" value={current} min={lower} max={upper} step={increment} disabled={disabled} onChange={event => { if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber))
    change(event.target.valueAsNumber); }}/><button className="md-button md-button-outline" type="button" aria-label={`Augmenter : ${label}`} disabled={disabled || current >= upper} onClick={() => change(current + increment)}>+</button></div></div>; }
