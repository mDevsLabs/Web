'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface CheckboxProps extends ComponentPropsWithoutRef<typeof RCheckbox.Root> {
    label: string;
}
export function Checkbox({ label, className, id, ...props }: CheckboxProps) { const generated = useId(); const inputId = id ?? generated; return <div className="md-check-row"><RCheckbox.Root {...props} id={inputId} className={cx('md-checkbox', className)}><RCheckbox.Indicator>✓</RCheckbox.Indicator></RCheckbox.Root><label htmlFor={inputId}>{label}</label></div>; }
