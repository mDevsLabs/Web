'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    status: 'online' | 'offline' | 'busy' | 'away';
    labels?: Partial<Record<'online' | 'offline' | 'busy' | 'away', string>>;
}
export function StatusBadge({ status, labels, className, ...props }: StatusBadgeProps) { const defaults = { online: 'En ligne', offline: 'Hors ligne', busy: 'Occupé', away: 'Absent' }; return <span {...props} className={cx('md-badge', className)} data-tone={status === 'online' ? 'success' : status === 'busy' ? 'danger' : 'neutral'}><span className="md-status-dot" aria-hidden="true"/>{labels?.[status] ?? defaults[status]}</span>; }
