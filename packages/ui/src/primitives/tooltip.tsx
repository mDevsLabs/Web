'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
}
export function Tooltip({ content, children, delayDuration = 350, side = 'top' }: TooltipProps) { return <RTooltip.Provider delayDuration={delayDuration}><RTooltip.Root><RTooltip.Trigger asChild>{children}</RTooltip.Trigger><RTooltip.Portal><PortalScope><RTooltip.Content className="md-tooltip" side={side} sideOffset={8}>{content}<RTooltip.Arrow /></RTooltip.Content></PortalScope></RTooltip.Portal></RTooltip.Root></RTooltip.Provider>; }
