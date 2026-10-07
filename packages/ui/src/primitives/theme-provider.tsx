'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
    theme?: 'light' | 'dark' | 'system';
    accent?: string;
    radius?: string;
    glass?: boolean;
}
export function ThemeProvider({ theme = 'system', accent, radius, glass = true, className, style, ...props }: ThemeProviderProps) {
    return <ThemeContext.Provider value={{ theme, accent, radius, glass, variables: Object.fromEntries(Object.entries(style ?? {}).filter(([key]) => key.startsWith('--'))) }}><div {...props} className={cx('md-root', className)} data-md-theme={theme} data-md-glass={glass ? 'on' : 'off'} style={{ ...style, ...(accent ? { '--md-accent': accent } : {}), ...(radius ? { '--md-radius': radius } : {}) } as CSSProperties}/></ThemeContext.Provider>;
}
