'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ComboboxProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    emptyMessage?: string;
}
export function Combobox({ label, options, value, onValueChange, disabled, placeholder = 'Rechercher…', emptyMessage = 'Aucun choix disponible.', className, ...props }: ComboboxProps) { const id = useId(); const input = useRef<HTMLInputElement>(null); const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [active, setActive] = useState(-1); const available = options.filter(option => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())); const selected = options.find(option => option.value === value); const selectable = available.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0); const highlighted = active >= 0 && !available[active]?.disabled ? available[active] : undefined; useEffect(() => { if (disabled) {
    setOpen(false);
    setQuery('');
    setActive(-1);
} }, [disabled]); const choose = (next: string) => { if (disabled)
    return; onValueChange(next); setOpen(false); setQuery(''); setActive(-1); input.current?.focus(); }; return <div {...props} className={cx('md-field md-combobox', className)}><label htmlFor={id}>{label}</label><input ref={input} id={id} className="md-input" role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} aria-activedescendant={open && highlighted ? `${id}-option-${active}` : undefined} disabled={disabled} value={open ? query : selected?.label ?? ''} placeholder={placeholder} onFocus={() => { setOpen(true); setQuery(''); setActive(-1); }} onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
    setOpen(false);
    setQuery('');
    setActive(-1);
} }} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    setOpen(true);
    if (selectable.length) {
        const position = selectable.indexOf(active);
        const next = event.key === 'ArrowDown' ? (position + 1) % selectable.length : position < 0 ? selectable.length - 1 : (position - 1 + selectable.length) % selectable.length;
        setActive(selectable[next]);
    }
}
else if (event.key === 'Enter' && open) {
    event.preventDefault();
    if (highlighted)
        choose(highlighted.value);
}
else if (event.key === 'Escape') {
    event.preventDefault();
    setOpen(false);
    setQuery('');
    setActive(-1);
} }}/>{open && <div className="md-combobox-popup md-glass"><ul role="listbox" id={`${id}-list`} aria-label={label}>{available.map((option, index) => <li id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} aria-disabled={option.disabled || undefined} data-active={active === index || undefined} key={option.value} onMouseDown={event => event.preventDefault()} onClick={() => { if (!option.disabled)
    choose(option.value); }}>{option.label}</li>)}</ul>{!available.length && <p role="status">{emptyMessage}</p>}</div>}</div>; }
