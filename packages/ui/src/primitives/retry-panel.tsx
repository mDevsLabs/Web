'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface RetryPanelProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    onRetry: () => void;
    pending?: boolean;
    retryLabel?: string;
}
export function RetryPanel({ message, onRetry, pending = false, retryLabel = 'Réessayer', className, ...props }: RetryPanelProps) { return <div {...props} className={cx('md-retry-panel md-glass md-pad-md', className)} aria-busy={pending || undefined}><p>{message}</p><button type="button" className="md-button" disabled={pending} onClick={onRetry}>{pending ? 'Chargement…' : retryLabel}</button><span role="status" className="md-sr-only">{pending ? 'Nouvelle tentative en cours.' : ''}</span></div>; }
