'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
}
export function Separator({ orientation = 'horizontal', decorative = true, className, ...props }: SeparatorProps) { return <div {...props} role={decorative ? 'none' : 'separator'} aria-orientation={decorative ? undefined : orientation} className={cx('md-separator', className)} data-orientation={orientation}/>; }
