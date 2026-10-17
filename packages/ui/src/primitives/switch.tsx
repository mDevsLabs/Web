'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SwitchProps extends ComponentPropsWithoutRef<typeof RSwitch.Root> {
    label: string;
}
export function Switch({ label, id, className, ...props }: SwitchProps) { const generated = useId(); const inputId = id ?? generated; return <div className="md-check-row"><RSwitch.Root {...props} id={inputId} className={cx('md-switch', className)}><RSwitch.Thumb className="md-switch-thumb"/></RSwitch.Root><label htmlFor={inputId}>{label}</label></div>; }
