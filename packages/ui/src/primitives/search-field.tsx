'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SearchFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onSearch: (query: string) => void;
    pending?: boolean;
    placeholder?: string;
}
export function SearchField({ label, value, onValueChange, onSearch, pending = false, placeholder = 'Rechercher…', className, ...props }: SearchFieldProps) { const id = useId(); const input = useRef<HTMLInputElement>(null); return <div {...props} className={className}><form role="search" aria-label={label} onSubmit={event => { event.preventDefault(); if (!pending)
    onSearch(value.trim()); }}><label className="md-field" htmlFor={id}>{label}<span className="md-input-group"><input ref={input} id={id} className="md-input" type="search" value={value} placeholder={placeholder} disabled={pending} onChange={event => onValueChange(event.target.value)}/><button type="submit" className="md-button" disabled={pending}>Rechercher</button>{value && <button type="button" className="md-button md-button-ghost" disabled={pending} aria-label="Effacer la recherche" onClick={() => { onValueChange(''); input.current?.focus(); }}>Effacer</button>}</span></label></form></div>; }
