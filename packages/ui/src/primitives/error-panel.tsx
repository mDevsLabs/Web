'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ErrorPanelProps extends HTMLAttributes<HTMLDivElement> {
    heading: string;
    message: string;
    details?: string;
    reference?: string;
}
export function ErrorPanel({ heading, message, details, reference, className, ...props }: ErrorPanelProps) { const id = useId(); return <div {...props} role="alert" aria-labelledby={id} className={cx('md-error-panel md-glass md-pad-md', className)}><h3 id={id}>{heading}</h3><p>{message}</p>{reference && <p className="md-muted">Référence : <code>{reference}</code></p>}{details && <details><summary>Détails techniques</summary><pre>{details}</pre></details>}</div>; }
