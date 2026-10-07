'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ChoiceCardsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        description?: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}
export function ChoiceCards({ label, options, value, onValueChange, disabled, className, ...props }: ChoiceCardsProps) { const name = useId(); return <div {...props} className={className}><fieldset className="md-form-section" disabled={disabled}><legend>{label}</legend><div className="md-choice-cards">{options.map(option => <label className="md-choice-card" data-selected={value === option.value || undefined} key={option.value}><input type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onValueChange(option.value)}/><span><strong>{option.label}</strong>{option.description && <span className="md-muted">{option.description}</span>}</span></label>)}</div></fieldset></div>; }
