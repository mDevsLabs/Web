'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FilterChipsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    filters: readonly {
        id: string;
        label: string;
    }[];
    onRemove: (id: string) => void;
    onClear?: () => void;
}
export function FilterChips({ label, filters, onRemove, onClear, className, ...props }: FilterChipsProps) { const region = useRef<HTMLDivElement>(null); const shouldFocus = useRef(false); useEffect(() => { if (shouldFocus.current) {
    shouldFocus.current = false;
    const target = region.current?.querySelector<HTMLButtonElement>('button');
    if (target)
        target.focus();
    else
        region.current?.focus();
} }, [filters.length]); return <div {...props} ref={region} tabIndex={-1} role="group" aria-label={label} className={cx('md-filter-chips', className)}>{filters.map(filter => <span className="md-filter-chip" key={filter.id}>{filter.label}<button type="button" aria-label={`Retirer le filtre ${filter.label}`} onClick={() => { shouldFocus.current = true; onRemove(filter.id); }}>×</button></span>)}{onClear && filters.length > 0 && <button type="button" className="md-button md-button-ghost" onClick={() => { shouldFocus.current = true; onClear(); }}>Tout effacer</button>}{!filters.length && <span className="md-muted">Aucun filtre actif.</span>}</div>; }
