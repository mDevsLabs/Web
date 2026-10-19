'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FormErrorSummaryProps extends HTMLAttributes<HTMLDivElement> {
    errors: readonly {
        fieldId: string;
        message: string;
    }[];
    heading?: string;
}
export function FormErrorSummary({ errors, heading = 'Corrigez les champs suivants', className, ...props }: FormErrorSummaryProps) { const id = useId(); if (!errors.length)
    return null; return <div {...props} role="alert" aria-labelledby={id} className={cx('md-error-summary', className)}><h3 id={id}>{heading}</h3><ul>{errors.map((error, index) => <li key={`${error.fieldId}-${index}`}><a href={`#${error.fieldId}`}>{error.message}</a></li>)}</ul></div>; }
