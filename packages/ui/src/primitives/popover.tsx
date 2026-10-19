'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PopoverProps {
    trigger: ReactNode;
    children?: ReactNode;
    label: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: 'top' | 'right' | 'bottom' | 'left';
}
export function Popover({ trigger, children, label, side = 'bottom', ...props }: PopoverProps) { return <RPopover.Root {...props}><RPopover.Trigger asChild>{trigger}</RPopover.Trigger><RPopover.Portal><PortalScope><RPopover.Content side={side} sideOffset={8} className="md-glass md-popover" aria-label={label}>{children}<RPopover.Arrow className="md-popover-arrow"/></RPopover.Content></PortalScope></RPopover.Portal></RPopover.Root>; }
