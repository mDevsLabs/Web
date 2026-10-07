'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SparklineProps extends HTMLAttributes<HTMLElement> {
    label: string;
    values: readonly number[];
    width?: number;
    height?: number;
}
export function Sparkline({ label, values, width = 160, height = 48, className, ...props }: SparklineProps) { const id = useId(); const valid = values.filter(Number.isFinite); const low = valid.length ? Math.min(...valid) : 0; const high = valid.length ? Math.max(...valid) : 1; const range = high - low || 1; const w = Number.isFinite(width) ? Math.max(16, width) : 160; const h = Number.isFinite(height) ? Math.max(16, height) : 48; const points = valid.map((value, index) => `${valid.length === 1 ? w / 2 : 4 + index / (valid.length - 1) * (w - 8)},${h - 4 - (value - low) / range * (h - 8)}`).join(' '); return <figure {...props} className={cx('md-sparkline', className)} aria-labelledby={id}><figcaption id={id}>{label}</figcaption><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">{valid.length > 1 ? <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/> : valid.length === 1 ? <circle cx={w / 2} cy={h - 4 - (valid[0] - low) / range * (h - 8)} r="2" fill="currentColor"/> : null}</svg><span className="md-sr-only">{valid.length ? `Valeurs : ${valid.join(', ')}` : 'Aucune valeur.'}</span></figure>; }
