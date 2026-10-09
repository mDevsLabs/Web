'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, className, type = 'button', ...props }, ref) { return <button {...props} ref={ref} type={type} aria-label={label} className={cx('md-button md-button-ghost md-icon-button', className)}/>; });
