'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
    brand: ReactNode;
    navigation?: ReactNode;
    actions?: ReactNode;
}
export function AppHeader({ brand, navigation, actions, children, className, ...props }: AppHeaderProps) { return <header {...props} className={cx('md-app-header md-glass', className)}><div className="md-app-brand">{brand}</div>{navigation && <div className="md-app-navigation">{navigation}</div>}{actions && <div className="md-cluster">{actions}</div>}{children}</header>; }
