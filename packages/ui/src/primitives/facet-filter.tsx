'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FacetFilterProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        count: number;
        disabled?: boolean;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
}
export function FacetFilter({ label, options, value, onValueChange, className, ...props }: FacetFilterProps) { return <div {...props} className={cx('md-facet-filter', className)}><fieldset className="md-form-section"><legend>{label}</legend>{options.map(option => <label className="md-choice-row" key={option.value}><input type="checkbox" disabled={option.disabled} checked={value.includes(option.value)} onChange={event => onValueChange(event.target.checked ? [...value, option.value] : value.filter(item => item !== option.value))}/><span>{option.label}</span><span className="md-badge">{option.count}</span></label>)}</fieldset></div>; }
