'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SavingIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
    state: 'idle' | 'saving' | 'saved' | 'error';
    labels?: Partial<Record<'idle' | 'saving' | 'saved' | 'error', string>>;
}
export function SavingIndicator({ state, labels, className, ...props }: SavingIndicatorProps) { const text = { idle: 'Aucune modification', saving: 'Enregistrement en cours…', saved: 'Enregistré', error: 'Échec de l’enregistrement' }; return <span {...props} role="status" className={cx('md-saving-indicator', className)} data-state={state}>{state === 'saving' && <span aria-hidden="true" className="md-spinner"/>}{labels?.[state] ?? text[state]}</span>; }
