'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title: string;
    description?: string;
    breadcrumbs?: ReactNode;
    actions?: ReactNode;
    headingLevel?: 1 | 2;
}
export function PageHeader({ title, description, breadcrumbs, actions, headingLevel = 1, className, ...props }: PageHeaderProps) { const HeadingTag = headingLevel === 1 ? 'h1' : 'h2'; return <header {...props} className={cx('md-page-header', className)}>{breadcrumbs}<div className="md-page-title"><div><HeadingTag>{title}</HeadingTag>{description && <p className="md-muted">{description}</p>}</div>{actions && <div className="md-cluster">{actions}</div>}</div></header>; }
