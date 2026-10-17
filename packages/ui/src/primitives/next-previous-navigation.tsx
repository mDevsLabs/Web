'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface NextPreviousNavigationProps extends HTMLAttributes<HTMLElement> {
    previous?: {
        href: string;
        label: string;
    };
    next?: {
        href: string;
        label: string;
    };
    label?: string;
}
export function NextPreviousNavigation({ previous, next, label = 'Documents voisins', className, ...props }: NextPreviousNavigationProps) { return <nav {...props} aria-label={label} className={cx('md-neighbor-navigation', className)}>{previous ? <a href={previous.href} rel="prev"><small>Précédent</small><strong>{previous.label}</strong></a> : <span />}{next ? <a href={next.href} rel="next"><small>Suivant</small><strong>{next.label}</strong></a> : <span />}</nav>; }
