'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface CharacterCountTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
}
export function CharacterCountTextarea({ label, value, onValueChange, maxLength = 500, id: givenId, 'aria-describedby': describedBy, className, ...props }: CharacterCountTextareaProps) { const generated = useId(); const id = givenId ?? generated; const counter = `${id}-count`; return <div className="md-field"><label htmlFor={id}>{label}</label><textarea {...props} id={id} value={value} maxLength={maxLength} onChange={event => onValueChange(event.target.value)} aria-describedby={[describedBy, counter].filter(Boolean).join(' ')} className={cx('md-textarea', className)}/><small id={counter} className="md-muted">{value.length} / {maxLength} caractères</small></div>; }
