'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface MobileNavigationProps {
    label: string;
    items: readonly {
        id: string;
        label: string;
        href: string;
    }[];
    currentId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}
export function MobileNavigation({ label, items, currentId, open, onOpenChange }: MobileNavigationProps) { const [visible, setVisible] = useControllable(open, false, onOpenChange); return <RDialog.Root open={visible} onOpenChange={setVisible}><RDialog.Trigger asChild><button type="button" className="md-button md-button-outline" aria-label={`Ouvrir : ${label}`}>Menu</button></RDialog.Trigger><RDialog.Portal><PortalScope><RDialog.Overlay className="md-overlay"/><RDialog.Content className="md-dialog md-glass" aria-describedby={undefined}><RDialog.Title className="md-heading">{label}</RDialog.Title><nav aria-label={label}><ul className="md-navigation-links">{items.map(item => <li key={item.id}><RDialog.Close asChild><a href={item.href} aria-current={currentId === item.id ? 'page' : undefined}>{item.label}</a></RDialog.Close></li>)}</ul></nav><RDialog.Close asChild><button type="button" className="md-button md-button-outline">Fermer le menu</button></RDialog.Close></RDialog.Content></PortalScope></RDialog.Portal></RDialog.Root>; }
