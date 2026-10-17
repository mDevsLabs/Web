'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
    names: readonly string[];
    max?: number;
}
export function AvatarGroup({ names, max = 4, className, ...props }: AvatarGroupProps) { const count = Math.max(1, max); return <div {...props} className={cx('md-avatar-group', className)} role="group" aria-label={names.join(', ')}>{names.slice(0, count).map((name, i) => <span className="md-avatar" key={`${name}-${i}`} title={name} aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span>)}{names.length > count && <span className="md-avatar">+{names.length - count}</span>}</div>; }
