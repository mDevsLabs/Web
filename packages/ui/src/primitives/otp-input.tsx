'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface OtpInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'maxLength'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    length?: number;
}
export function OtpInput({ label, value, onValueChange, length = 6, id: givenId, className, ...props }: OtpInputProps) { const generated = useId(); const id = givenId ?? generated; const count = Math.min(12, Math.max(1, Math.floor(length) || 6)); return <label className="md-field" htmlFor={id}>{label}<input {...props} id={id} className={cx('md-input md-otp', className)} inputMode="numeric" autoComplete="one-time-code" pattern={`[0-9]{${count}}`} maxLength={count} value={value} onChange={event => onValueChange(event.target.value.replace(/[^0-9]/g, '').slice(0, count))}/></label>; }
