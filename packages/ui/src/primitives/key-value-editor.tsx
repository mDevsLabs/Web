'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface KeyValueEditorProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly {
        id: string;
        key: string;
        value: string;
    }[];
    onValueChange: (value: {
        id: string;
        key: string;
        value: string;
    }[]) => void;
    disabled?: boolean;
}
export function KeyValueEditor({ label, value, onValueChange, disabled, className, ...props }: KeyValueEditorProps) { const prefix = useId(); const sequence = useRef(0); const addButton = useRef<HTMLButtonElement>(null); const update = (id: string, key: 'key' | 'value', next: string) => onValueChange(value.map(row => row.id === id ? { ...row, [key]: next } : row)); return <div {...props} className={className}><fieldset className="md-form-section" disabled={disabled}><legend>{label}</legend><div className="md-stack">{value.map((row, index) => { const duplicate = !!row.key.trim() && value.some(other => other.id !== row.id && other.key.trim() === row.key.trim()); const errorId = `${prefix}-${index}-error`; return <div className="md-key-value-row" key={row.id}><label className="md-field">Clé {index + 1}<input className="md-input" value={row.key} aria-invalid={duplicate || undefined} aria-describedby={duplicate ? errorId : undefined} onChange={event => update(row.id, 'key', event.target.value)}/></label><label className="md-field">Valeur {index + 1}<input className="md-input" value={row.value} onChange={event => update(row.id, 'value', event.target.value)}/></label><button type="button" className="md-button md-button-outline" aria-label={`Supprimer la paire ${index + 1}`} onClick={() => { onValueChange(value.filter(other => other.id !== row.id)); addButton.current?.focus(); }}>Supprimer</button>{duplicate && <p id={errorId} className="md-field-error">Cette clé est déjà utilisée.</p>}</div>; })}</div><button ref={addButton} type="button" className="md-button md-button-soft" onClick={() => { let id: string; do {
    id = `${prefix}-${sequence.current++}`;
} while (value.some(row => row.id === id)); onValueChange([...value, { id, key: '', value: '' }]); }}>Ajouter une paire</button></fieldset></div>; }
