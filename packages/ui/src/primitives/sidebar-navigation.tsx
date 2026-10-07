'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SidebarNavigationProps extends HTMLAttributes<HTMLElement> {
    label: string;
    sections: readonly {
        id: string;
        label: string;
        items: readonly {
            id: string;
            label: string;
            href: string;
            count?: number;
        }[];
    }[];
    currentId?: string;
}
export function SidebarNavigation({ label, sections, currentId, className, ...props }: SidebarNavigationProps) { const prefix = useId(); return <nav {...props} aria-label={label} className={cx('md-sidebar-navigation', className)}>{sections.map((section, index) => <section key={section.id} aria-labelledby={`${prefix}-${index}`}><h2 id={`${prefix}-${index}`}>{section.label}</h2><ul>{section.items.map(item => <li key={item.id}><a href={item.href} aria-current={item.id === currentId ? 'page' : undefined}><span>{item.label}</span>{item.count !== undefined && <span className="md-badge">{item.count}</span>}</a></li>)}</ul></section>)}</nav>; }
