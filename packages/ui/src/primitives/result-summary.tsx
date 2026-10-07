'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ResultSummaryProps extends HTMLAttributes<HTMLParagraphElement> {
    total: number;
    page: number;
    pageSize: number;
    label?: string;
}
export function ResultSummary({ total, page, pageSize, label = 'résultats', className, ...props }: ResultSummaryProps) { const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0; const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1; const current = Number.isFinite(page) ? Math.max(1, Math.min(Math.max(1, Math.ceil(count / size)), Math.floor(page))) : 1; const start = count ? (current - 1) * size + 1 : 0; return <p {...props} role="status" className={cx('md-muted', className)}>{start}–{Math.min(count, current * size)} sur {count} {label}</p>; }
