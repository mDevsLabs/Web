'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    tone?: 'info' | 'success' | 'warning' | 'danger';
    heading?: string;
    live?: boolean;
}
export function Alert({ tone = 'info', heading, live = false, className, children, ...props }: AlertProps) { return <div {...props} role={live ? tone === 'danger' ? 'alert' : 'status' : undefined} className={cx('md-alert', className)} data-tone={tone}>{heading && <strong>{heading}</strong>}<div>{children}</div></div>; }
