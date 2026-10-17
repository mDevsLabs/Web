'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    htmlFor: string;
    hint?: string;
    error?: string;
}
export function Field({ label, htmlFor, hint, error, className, children, ...props }: FieldProps) { return <div {...props} className={cx('md-field', className)}><label htmlFor={htmlFor}>{label}</label>{children}{hint && <p id={`${htmlFor}-hint`} className="md-muted">{hint}</p>}{error && <p id={`${htmlFor}-error`} className="md-error" role="alert">{error}</p>}</div>; }
