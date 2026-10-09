'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface DrawerProps {
    title: string;
    description?: string;
    trigger?: ReactNode;
    children?: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'left' | 'right' | 'bottom';
    closeLabel?: string;
}
export function Drawer({ title, description, trigger, children, side = 'right', closeLabel = 'Fermer', ...props }: DrawerProps) { const descriptionId = useId(); return <RDialog.Root {...props}>{trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}<RDialog.Portal><PortalScope><RDialog.Overlay className="md-overlay"/><RDialog.Content className="md-glass md-drawer" data-side={side} aria-describedby={description ? descriptionId : undefined}><RDialog.Title>{title}</RDialog.Title>{description && <RDialog.Description id={descriptionId} className="md-muted">{description}</RDialog.Description>}{children}<RDialog.Close className="md-close" aria-label={closeLabel}>×</RDialog.Close></RDialog.Content></PortalScope></RDialog.Portal></RDialog.Root>; }
