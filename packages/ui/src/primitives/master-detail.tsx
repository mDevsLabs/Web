'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface MasterDetailProps extends HTMLAttributes<HTMLDivElement> {
    items: readonly {
        id: string;
        label: string;
        description?: string;
    }[];
    selectedId?: string;
    onSelectionChange: (id: string) => void;
    children?: ReactNode;
    label: string;
    emptyMessage?: string;
}
export function MasterDetail({ items, selectedId, onSelectionChange, children, label, emptyMessage = 'Sélectionnez un élément.', className, ...props }: MasterDetailProps) { const id = useId(); return <div {...props} className={cx('md-master-detail', className)}><section aria-labelledby={`${id}-list`}><h2 id={`${id}-list`}>{label}</h2><ul>{items.map(item => <li key={item.id}><button type="button" className="md-master-item" aria-pressed={selectedId === item.id} onClick={() => onSelectionChange(item.id)}><strong>{item.label}</strong>{item.description && <span className="md-muted">{item.description}</span>}</button></li>)}</ul></section><section aria-label="Détails de la sélection" aria-live="polite">{selectedId ? children : <p className="md-muted">{emptyMessage}</p>}</section></div>; }
