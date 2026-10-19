'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface DualListSelectorProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    disabled?: boolean;
}
export function DualListSelector({ label, options, value, onValueChange, disabled, className, ...props }: DualListSelectorProps) { const id = useId(); const [left, setLeft] = useState<string[]>([]); const [right, setRight] = useState<string[]>([]); return <div {...props} className={className}><fieldset className="md-form-section" disabled={disabled}><legend>{label}</legend><div className="md-transfer"><label htmlFor={`${id}-available`}>Disponibles<select id={`${id}-available`} className="md-select" multiple size={5} value={left} onChange={event => setLeft(Array.from(event.target.selectedOptions, option => option.value))}>{options.filter(option => !value.includes(option.value)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><div className="md-stack"><button type="button" className="md-button md-button-outline" disabled={!left.length} onClick={() => { onValueChange([...new Set([...value, ...left])]); setLeft([]); }}>Ajouter →</button><button type="button" className="md-button md-button-outline" disabled={!right.length} onClick={() => { onValueChange(value.filter(item => !right.includes(item))); setRight([]); }}>← Retirer</button></div><label htmlFor={`${id}-selected`}>Sélectionnés<select id={`${id}-selected`} className="md-select" multiple size={5} value={right} onChange={event => setRight(Array.from(event.target.selectedOptions, option => option.value))}>{options.filter(option => value.includes(option.value)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div></fieldset></div>; }
