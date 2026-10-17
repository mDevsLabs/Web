'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    label?: string;
}
export function Pagination({ page, totalPages, onPageChange, label = 'Pagination', className, ...props }: PaginationProps) { const total = Math.max(1, Math.floor(totalPages)); const current = Math.max(1, Math.min(total, page)); return <nav {...props} aria-label={label} className={cx('md-pagination', className)}><button type="button" className="md-button md-button-outline" disabled={current <= 1} onClick={() => onPageChange(current - 1)}>Précédent</button><span aria-live="polite">{current} / {total}</span><button type="button" className="md-button md-button-outline" disabled={current >= total} onClick={() => onPageChange(current + 1)}>Suivant</button></nav>; }
