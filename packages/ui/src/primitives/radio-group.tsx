'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
    label: string;
    name: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}
export function RadioGroup({ label, name, options, value, defaultValue = '', onValueChange, className, ...props }: RadioGroupProps) { const [current, update] = useControllable(value, defaultValue, onValueChange); const id = useId(); return <fieldset {...props} className={cx('md-fieldset md-radio-group', className)}><legend>{label}</legend>{options.map((o, i) => <div className="md-check-row" key={o.value}><input id={`${id}-${i}`} type="radio" name={name} value={o.value} checked={current === o.value} disabled={o.disabled} onChange={() => update(o.value)}/><label htmlFor={`${id}-${i}`}>{o.label}</label></div>)}</fieldset>; }
