'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AnchorNavigationProps extends HTMLAttributes<HTMLElement> {
    label: string;
    items: readonly {
        id: string;
        label: string;
    }[];
    activeId?: string;
}
export function AnchorNavigation({ label, items, activeId, className, ...props }: AnchorNavigationProps) { return <nav {...props} aria-label={label} className={cx('md-anchor-navigation', className)}><ol>{items.map(item => <li key={item.id}><a href={`#${encodeURIComponent(item.id)}`} aria-current={activeId === item.id ? 'location' : undefined}>{item.label}</a></li>)}</ol></nav>; }
