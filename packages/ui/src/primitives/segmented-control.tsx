'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SegmentedControlProps {
    value: string;
    onValueChange: (value: string) => void;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    label: string;
}
export function SegmentedControl({ value, onValueChange, options, label }: SegmentedControlProps) { const id = useId(); return <fieldset className="md-fieldset md-segmented"><legend className="md-sr-only">{label}</legend>{options.map(o => <label key={o.value} data-active={value === o.value}><input type="radio" name={id} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onValueChange(o.value)}/><span>{o.label}</span></label>)}</fieldset>; }
