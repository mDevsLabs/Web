'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ConfirmDialogProps {
    title: string;
    description: string;
    trigger: ReactNode;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
}
export function ConfirmDialog({ title, description, trigger, onConfirm, confirmLabel = 'Confirmer', cancelLabel = 'Annuler' }: ConfirmDialogProps) { return <RDialog.Root><RDialog.Trigger asChild>{trigger}</RDialog.Trigger><RDialog.Portal><PortalScope><RDialog.Overlay className="md-overlay"/><RDialog.Content className="md-glass md-dialog"><RDialog.Title>{title}</RDialog.Title><RDialog.Description>{description}</RDialog.Description><div className="md-cluster"><RDialog.Close className="md-button md-button-outline">{cancelLabel}</RDialog.Close><RDialog.Close className="md-button" onClick={onConfirm}>{confirmLabel}</RDialog.Close></div></RDialog.Content></PortalScope></RDialog.Portal></RDialog.Root>; }
