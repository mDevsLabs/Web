'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PasswordRequirementsProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
    minLength?: number;
    label?: string;
}
export function PasswordRequirements({ value, minLength = 12, label = 'Conditions du mot de passe', className, ...props }: PasswordRequirementsProps) { const id = useId(); const rules = [{ label: `Au moins ${minLength} caractères`, met: value.length >= minLength }, { label: 'Une lettre majuscule', met: /[A-Z]/.test(value) }, { label: 'Une lettre minuscule', met: /[a-z]/.test(value) }, { label: 'Un chiffre', met: /[0-9]/.test(value) }]; return <div {...props} className={cx('md-password-rules', className)} aria-labelledby={id}><p id={id}>{label}</p><ul>{rules.map(rule => <li key={rule.label} data-met={rule.met || undefined}><span aria-hidden="true">{rule.met ? '✓' : '○'}</span><span className="md-sr-only">{rule.met ? 'Respecté : ' : 'À compléter : '}</span>{rule.label}</li>)}</ul></div>; }
