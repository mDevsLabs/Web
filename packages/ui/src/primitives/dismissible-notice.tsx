'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface DismissibleNoticeProps extends HTMLAttributes<HTMLDivElement> {
    heading: string;
    children?: ReactNode;
    onDismiss: () => void;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
export function DismissibleNotice({ heading, children, onDismiss, tone = 'neutral', className, ...props }: DismissibleNoticeProps) { const id = useId(); return <div {...props} role={tone === 'danger' ? 'alert' : 'status'} aria-labelledby={id} className={cx('md-inline-notice md-glass', className)} data-tone={tone}><div><strong id={id}>{heading}</strong>{children && <div>{children}</div>}</div><button type="button" className="md-button md-button-ghost" aria-label={`Fermer : ${heading}`} onClick={onDismiss}>×</button></div>; }
