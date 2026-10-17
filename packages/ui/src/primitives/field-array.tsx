'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FieldArrayProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly {
        id: string;
        value: string;
    }[];
    onValueChange: (value: {
        id: string;
        value: string;
    }[]) => void;
    maxItems?: number;
    disabled?: boolean;
}
export function FieldArray({ label, value, onValueChange, maxItems = 20, disabled, className, ...props }: FieldArrayProps) { const prefix = useId(); const sequence = useRef(0); const addButton = useRef<HTMLButtonElement>(null); const focusAfterRemoval = useRef(false); useEffect(() => { if (focusAfterRemoval.current) {
    focusAfterRemoval.current = false;
    addButton.current?.focus();
} }, [value.length]); const add = () => { let id: string; do {
    id = `${prefix}-${sequence.current++}`;
} while (value.some(row => row.id === id)); onValueChange([...value, { id, value: '' }]); }; return <div {...props} className={className}><fieldset className="md-form-section" disabled={disabled}><legend>{label}</legend><div className="md-stack">{value.map((row, index) => <div className="md-input-group" key={row.id}><input className="md-input" aria-label={`${label} ${index + 1}`} value={row.value} onChange={event => onValueChange(value.map(item => item.id === row.id ? { ...item, value: event.target.value } : item))}/><button type="button" className="md-button md-button-outline" aria-label={`Supprimer ${label} ${index + 1}`} onClick={() => { focusAfterRemoval.current = true; onValueChange(value.filter(item => item.id !== row.id)); }}>Supprimer</button></div>)}</div><button ref={addButton} type="button" className="md-button md-button-soft" disabled={value.length >= maxItems} onClick={add}>Ajouter</button></fieldset></div>; }
