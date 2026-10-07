'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface DropdownMenuItem {
    id: string;
    label: string;
    onSelect?: () => void;
    disabled?: boolean;
    danger?: boolean;
    separatorBefore?: boolean;
}
export interface DropdownMenuProps {
    trigger: ReactNode;
    items: readonly DropdownMenuItem[];
    label: string;
}
export function DropdownMenu({ trigger, items, label }: DropdownMenuProps) { return <RDropdown.Root><RDropdown.Trigger asChild>{trigger}</RDropdown.Trigger><RDropdown.Portal><PortalScope><RDropdown.Content className="md-glass md-menu" sideOffset={8} aria-label={label}>{items.map(item => <span key={item.id}>{item.separatorBefore && <RDropdown.Separator className="md-separator"/>}<RDropdown.Item className="md-menu-item" disabled={item.disabled} data-danger={item.danger || undefined} onSelect={item.onSelect}>{item.label}</RDropdown.Item></span>)}</RDropdown.Content></PortalScope></RDropdown.Portal></RDropdown.Root>; }
