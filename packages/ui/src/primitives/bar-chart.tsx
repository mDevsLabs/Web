'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface BarChartProps extends HTMLAttributes<HTMLElement> {
    title: string;
    items: readonly {
        id: string;
        label: string;
        value: number;
    }[];
    unit?: string;
}
export function BarChart({ title, items, unit = '', className, ...props }: BarChartProps) { const id = useId(); const maximum = Math.max(1, ...items.map(item => Number.isFinite(item.value) ? Math.max(0, item.value) : 0)); return <figure {...props} className={cx('md-bar-chart', className)} aria-labelledby={id}><figcaption id={id}>{title}</figcaption><dl>{items.map(item => <div key={item.id}><dt>{item.label}</dt><dd><span>{item.value}{unit && ` ${unit}`}</span><span className="md-chart-track" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, Number.isFinite(item.value) ? item.value / maximum * 100 : 0))}%` }}/></span></dd></div>)}</dl></figure>; }
