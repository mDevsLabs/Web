'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface StickyActionsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    position?: 'top' | 'bottom';
    children?: ReactNode;
}
export function StickyActions({ label, position = 'bottom', children, className, ...props }: StickyActionsProps) { return <div {...props} className={cx('md-sticky-actions md-glass', className)} data-position={position} role="group" aria-label={label}>{children}</div>; }
