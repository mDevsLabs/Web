'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ClearableInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    clearLabel?: string;
}
export function ClearableInput({ label, value, onValueChange, clearLabel = 'Effacer', id: givenId, disabled, className, ...props }: ClearableInputProps) { const generated = useId(); const id = givenId ?? generated; const input = useRef<HTMLInputElement>(null); return <div className="md-field"><label htmlFor={id}>{label}</label><div className="md-input-group"><input {...props} ref={input} id={id} disabled={disabled} value={value} onChange={event => onValueChange(event.target.value)} className={cx('md-input', className)}/><button type="button" className="md-button md-button-ghost" disabled={disabled || !value} aria-label={clearLabel} onClick={() => { onValueChange(''); input.current?.focus(); }}>×</button></div></div>; }
