'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    showLabel?: string;
    hideLabel?: string;
}
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput({ showLabel = 'Afficher le mot de passe', hideLabel = 'Masquer le mot de passe', className, ...props }, ref) { const [visible, setVisible] = useState(false); return <div className="md-password"><input {...props} ref={ref} type={visible ? 'text' : 'password'} className={cx('md-input', className)}/><button type="button" className="md-button md-button-ghost" aria-label={visible ? hideLabel : showLabel} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Masquer' : 'Afficher'}</button></div>; });
