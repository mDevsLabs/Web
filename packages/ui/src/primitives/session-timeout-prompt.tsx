'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SessionTimeoutPromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    secondsRemaining: number;
    onContinue: () => void;
    onSignOut: () => void;
    pending?: boolean;
    onReturnFocus?: () => void;
}
export function SessionTimeoutPrompt({ open, onOpenChange, secondsRemaining, onContinue, onSignOut, pending = false, onReturnFocus }: SessionTimeoutPromptProps) { return <RDialog.Root open={open} onOpenChange={onOpenChange}><RDialog.Portal><PortalScope><RDialog.Overlay className="md-overlay"/><RDialog.Content className="md-dialog md-glass" onCloseAutoFocus={event => { if (onReturnFocus) {
    event.preventDefault();
    onReturnFocus();
} }}><RDialog.Title className="md-heading">Votre session va expirer</RDialog.Title><RDialog.Description>Temps restant : {Math.max(0, Math.floor(secondsRemaining))} secondes. Souhaitez-vous poursuivre ?</RDialog.Description><div className="md-cluster"><button type="button" className="md-button" disabled={pending} onClick={onContinue}>Continuer la session</button><button type="button" className="md-button md-button-outline" disabled={pending} onClick={onSignOut}>Se déconnecter</button></div></RDialog.Content></PortalScope></RDialog.Portal></RDialog.Root>; }
