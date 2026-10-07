'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
    heading: string;
    description?: string;
    action?: ReactNode;
}
export function EmptyState({ heading, description, action, className, ...props }: EmptyStateProps) { return <div {...props} className={cx('md-empty', className)}><span className="md-empty-mark" aria-hidden="true">◇</span><h3>{heading}</h3>{description && <p className="md-muted">{description}</p>}{action}</div>; }
