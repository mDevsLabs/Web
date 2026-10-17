'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
    header?: ReactNode;
    sidebar?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    mainId?: string;
    mainLabel?: string;
}
export function AppShell({ header, sidebar, footer, children, mainId = 'main-content', mainLabel = 'Contenu principal', className, ...props }: AppShellProps) { return <div {...props} className={cx('md-app-shell', className)}>{header}<div className="md-shell-body">{sidebar && <aside aria-label="Navigation et outils" className="md-shell-sidebar">{sidebar}</aside>}<main id={mainId} tabIndex={-1} aria-label={mainLabel}>{children}</main></div>{footer}</div>; }
