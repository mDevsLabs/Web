'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface TabsProps {
    items: readonly {
        id: string;
        label: string;
        content: ReactNode;
        disabled?: boolean;
    }[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label: string;
}
export function Tabs({ items, label, defaultValue, ...props }: TabsProps) { return <RTabs.Root defaultValue={defaultValue ?? items[0]?.id} {...props} className="md-tabs"><RTabs.List aria-label={label} className="md-tab-list">{items.map(item => <RTabs.Trigger key={item.id} value={item.id} disabled={item.disabled} className="md-tab">{item.label}</RTabs.Trigger>)}</RTabs.List>{items.map(item => <RTabs.Content key={item.id} value={item.id} className="md-tab-panel">{item.content}</RTabs.Content>)}</RTabs.Root>; }
