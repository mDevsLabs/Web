'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
    items: readonly {
        label: string;
        href?: string;
    }[];
    label?: string;
}
export function Breadcrumbs({ items, label = 'Fil d’Ariane', className, ...props }: BreadcrumbsProps) { return <nav {...props} aria-label={label} className={cx('md-breadcrumbs', className)}><ol>{items.map((item, i) => <li key={i}>{i > 0 && <span aria-hidden="true">/</span>}{i === items.length - 1 ? <span aria-current="page">{item.label}</span> : item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}</li>)}</ol></nav>; }
