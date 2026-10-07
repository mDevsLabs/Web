'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface CommandItem {
    id: string;
    label: string;
    keywords?: string;
    onSelect: () => void;
}
export interface CommandPaletteProps {
    items: readonly CommandItem[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
    title?: string;
}
export function CommandPalette({ items, open, onOpenChange, trigger, title = 'Rechercher une action' }: CommandPaletteProps) { const [query, setQuery] = useState(''); const inputId = useId(); const filtered = items.filter(item => `${item.label} ${item.keywords ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())); return <RDialog.Root open={open} onOpenChange={value => { if (!value)
    setQuery(''); onOpenChange?.(value); }}>{trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}<RDialog.Portal><PortalScope><RDialog.Overlay className="md-overlay"/><RDialog.Content className="md-glass md-dialog" aria-describedby={undefined}><RDialog.Title>{title}</RDialog.Title><label htmlFor={inputId} className="md-sr-only">Rechercher une action</label><input id={inputId} autoFocus className="md-input" type="search" value={query} onChange={e => setQuery(e.target.value)}/><ul className="md-command-list">{filtered.map(item => <li key={item.id}><RDialog.Close asChild><button type="button" className="md-list-action" onClick={item.onSelect}>{item.label}</button></RDialog.Close></li>)}</ul>{filtered.length === 0 && <p role="status">Aucun résultat.</p>}<RDialog.Close className="md-close" aria-label="Fermer">×</RDialog.Close></RDialog.Content></PortalScope></RDialog.Portal></RDialog.Root>; }
