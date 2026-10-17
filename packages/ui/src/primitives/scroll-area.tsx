'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    maxHeight?: number | string;
    children?: ReactNode;
}
export function ScrollArea({ label, maxHeight = '20rem', children, className, style, ...props }: ScrollAreaProps) { return <div {...props} role="region" aria-label={label} tabIndex={0} className={cx('md-scroll-area', className)} style={{ maxHeight, ...style }}>{children}</div>; }
