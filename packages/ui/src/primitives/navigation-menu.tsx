'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface NavigationMenuProps extends HTMLAttributes<HTMLElement> {
    items: readonly {
        label: string;
        href: string;
        active?: boolean;
    }[];
    label: string;
}
export function NavigationMenu({ items, label, className, ...props }: NavigationMenuProps) { return <nav {...props} aria-label={label} className={cx('md-navigation', className)}><ul>{items.map(item => <li key={item.href}><a href={item.href} aria-current={item.active ? 'page' : undefined}>{item.label}</a></li>)}</ul></nav>; }
