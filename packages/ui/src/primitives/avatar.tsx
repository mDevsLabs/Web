'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
    src?: string;
    name: string;
    size?: number;
}
export function Avatar({ src, name, size = 40, style, className, ...props }: AvatarProps) { const [failed, setFailed] = useState(false); useEffect(() => setFailed(false), [src]); return <span {...props} role="img" aria-label={name} className={cx('md-avatar', className)} style={{ width: size, height: size, ...style }}>{src && !failed ? <img src={src} alt="" onError={() => setFailed(true)}/> : <span aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span>}</span>; }
