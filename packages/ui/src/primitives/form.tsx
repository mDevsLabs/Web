'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    onValuesSubmit?: (data: FormData) => void;
    onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
}
export function Form({ onValuesSubmit, onSubmit, className, ...props }: FormProps) { return <form {...props} className={cx('md-form-grid', className)} onSubmit={e => { onSubmit?.(e); if (!e.defaultPrevented && onValuesSubmit) {
    e.preventDefault();
    onValuesSubmit(new FormData(e.currentTarget));
} }}/>; }
