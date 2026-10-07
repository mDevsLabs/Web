'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface StatProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: ReactNode;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
export function Stat({ label, value, change, tone = 'neutral', className, ...props }: StatProps) { return <div {...props} className={cx('md-glass md-stat', className)} data-tone={tone}><dl><dt>{label}</dt><dd>{value}</dd></dl>{change && <p>{change}</p>}</div>; }
