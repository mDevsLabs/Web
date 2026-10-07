'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface AccordionProps {
    items: readonly {
        id: string;
        title: string;
        content: ReactNode;
        disabled?: boolean;
    }[];
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}
export function Accordion({ items, ...props }: AccordionProps) { return <RAccordion.Root type="single" collapsible {...props} className="md-accordion">{items.map(item => <RAccordion.Item key={item.id} value={item.id} disabled={item.disabled} className="md-accordion-item"><RAccordion.Header><RAccordion.Trigger className="md-accordion-trigger">{item.title}<span aria-hidden="true">⌄</span></RAccordion.Trigger></RAccordion.Header><RAccordion.Content className="md-accordion-content">{item.content}</RAccordion.Content></RAccordion.Item>)}</RAccordion.Root>; }
