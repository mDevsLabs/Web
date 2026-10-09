'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface RatingProps {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    max?: number;
    label: string;
    disabled?: boolean;
}
export function Rating({ value, defaultValue = 0, onValueChange, max = 5, label, disabled }: RatingProps) { const [current, update] = useControllable(value, defaultValue, onValueChange); const id = useId(); const count = Math.max(1, Math.min(10, Math.floor(max))); return <fieldset disabled={disabled} className="md-fieldset md-rating"><legend>{label}</legend>{Array.from({ length: count }, (_, i) => <label key={i} title={`${i + 1} / ${count}`}><input type="radio" name={id} value={i + 1} checked={current === i + 1} onChange={() => update(i + 1)} aria-label={`${i + 1} / ${count}`}/><span aria-hidden="true" data-filled={current >= i + 1}>★</span></label>)}</fieldset>; }
