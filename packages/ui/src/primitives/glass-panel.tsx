'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface GlassPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title: string;
    defaultOpen?: boolean;
}
export function GlassPanel({ title, defaultOpen = true, children, className, ...props }: GlassPanelProps) { return <details {...props} open={defaultOpen || undefined} className={cx('md-glass md-panel', className)}><summary>{title}</summary><div className="md-pad-md">{children}</div></details>; }
