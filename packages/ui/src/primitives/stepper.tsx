'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
    steps: readonly string[];
    currentStep: number;
}
export function Stepper({ steps, currentStep, className, ...props }: StepperProps) { return <ol {...props} className={cx('md-stepper', className)}>{steps.map((step, i) => <li key={i} aria-current={i === currentStep ? 'step' : undefined} data-complete={i < currentStep || undefined}><span aria-hidden="true">{i < currentStep ? '✓' : i + 1}</span><span>{step}</span>{i < currentStep && <span className="md-sr-only"> terminé</span>}</li>)}</ol>; }
