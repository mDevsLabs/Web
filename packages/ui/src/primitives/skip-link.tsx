'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    targetId?: string;
}
export function SkipLink({ targetId = 'main-content', children = 'Aller au contenu', className, ...props }: SkipLinkProps) { return <a {...props} href={`#${encodeURIComponent(targetId)}`} className={cx('md-skip-link', className)}>{children}</a>; }
