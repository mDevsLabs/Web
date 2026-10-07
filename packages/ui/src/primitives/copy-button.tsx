'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onCopy'> {
    value: string;
    onCopied?: () => void;
    onError?: (error: unknown) => void;
}
export function CopyButton({ value, onCopied, onError, children = 'Copier', className, ...props }: CopyButtonProps) { const [copied, setCopied] = useState(false); const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); useEffect(() => () => clearTimeout(timer.current), []); return <button {...props} type="button" className={cx('md-button md-button-soft', className)} onClick={async (e) => { props.onClick?.(e); if (e.defaultPrevented)
    return; try {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    onCopied?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
}
catch (error) {
    onError?.(error);
} }}>{copied ? 'Copié' : children}<span className="md-sr-only" role="status">{copied ? 'Copié dans le presse-papiers.' : ''}</span></button>; }
