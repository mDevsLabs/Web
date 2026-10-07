'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface UndoNoticeProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    pending?: boolean;
}
export function UndoNotice({ message, onUndo, onDismiss, pending = false, className, ...props }: UndoNoticeProps) { return <div {...props} className={cx('md-undo-notice md-glass', className)} aria-busy={pending || undefined}><p role="status">{message}</p><div className="md-cluster"><button type="button" className="md-button md-button-soft" disabled={pending} onClick={onUndo}>Annuler l’action</button><button type="button" className="md-button md-button-ghost" disabled={pending} aria-label="Fermer la confirmation" onClick={onDismiss}>Fermer</button></div></div>; }
