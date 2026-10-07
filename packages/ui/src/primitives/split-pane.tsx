'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SplitPaneProps extends HTMLAttributes<HTMLDivElement> {
    primary: ReactNode;
    secondary: ReactNode;
    value: number;
    onValueChange: (percent: number) => void;
    min?: number;
    max?: number;
    label?: string;
}
export function SplitPane({ primary, secondary, value, onValueChange, min = 20, max = 80, label = 'Largeur du premier panneau', className, style, ...props }: SplitPaneProps) { const id = useId(); const low = Math.max(10, Math.min(90, Number.isFinite(min) ? min : 20)); const high = Math.max(low, Math.min(90, Number.isFinite(max) ? max : 80)); const percent = Math.max(low, Math.min(high, Number.isFinite(value) ? value : 50)); return <div {...props} className={cx('md-split-pane', className)} style={{ ...style, '--md-split': `${percent}%` } as CSSProperties}><div className="md-split-content"><div>{primary}</div><div>{secondary}</div></div><label className="md-field" htmlFor={id}>{label}<input id={id} className="md-range" type="range" min={low} max={high} value={percent} onChange={event => onValueChange(event.target.valueAsNumber)}/></label></div>; }
