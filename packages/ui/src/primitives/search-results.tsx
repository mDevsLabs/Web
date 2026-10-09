'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SearchResultsProps extends HTMLAttributes<HTMLElement> {
    label: string;
    query: string;
    items: readonly {
        id: string;
        title: string;
        href: string;
        excerpt?: string;
    }[];
    pending?: boolean;
}
export function SearchResults({ label, query, items, pending = false, className, ...props }: SearchResultsProps) { const id = useId(); return <section {...props} className={cx('md-search-results', className)} aria-labelledby={id} aria-busy={pending || undefined}><h2 id={id}>{label}</h2><p role="status" className="md-muted">{pending ? 'Recherche en cours…' : `${items.length} résultat(s)${query ? ' pour « ' + query + ' »' : ''}`}</p><ol>{items.map(item => <li key={item.id}><article><h3><a href={item.href}>{item.title}</a></h3>{item.excerpt && <p>{item.excerpt}</p>}</article></li>)}</ol>{!pending && !items.length && <p>Aucun résultat. Essayez une recherche plus large.</p>}</section>; }
