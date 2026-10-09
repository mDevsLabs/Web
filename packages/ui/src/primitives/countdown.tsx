'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface CountdownProps extends HTMLAttributes<HTMLSpanElement> {
    seconds: number;
    label?: string;
    onElapsed?: () => void;
}
export function Countdown({ seconds, label = 'Temps restant', onElapsed, className, ...props }: CountdownProps) { const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))); const latest = useRef(onElapsed); useEffect(() => { latest.current = onElapsed; }, [onElapsed]); useEffect(() => { let value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0)); setRemaining(value); if (!value)
    return; const timer = setInterval(() => { value -= 1; setRemaining(value); if (value <= 0) {
    clearInterval(timer);
    latest.current?.();
} }, 1000); return () => clearInterval(timer); }, [seconds]); return <span {...props} role="timer" aria-label={label} aria-live="off" className={cx('md-countdown', className)}>{Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}</span>; }
