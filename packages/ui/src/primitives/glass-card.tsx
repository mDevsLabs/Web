'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface GlassCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    actions?: ReactNode;
}
export function GlassCard({ title, description, footer, actions, children, className, ...props }: GlassCardProps) { const id = useId(); return <article {...props} aria-labelledby={typeof title === 'string' ? id : undefined} className={cx('md-glass md-card', className)}>{(title || description || actions) && <header className="md-domain-heading"><div>{title && <h3 id={id}>{title}</h3>}{description && <p className="md-muted">{description}</p>}</div>{actions}</header>}<div>{children}</div>{footer && <footer className="md-card-footer">{footer}</footer>}</article>; }
