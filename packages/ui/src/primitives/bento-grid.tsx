'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
    items: readonly {
        id: string;
        title: string;
        content: ReactNode;
        span?: 1 | 2;
    }[];
}
export function BentoGrid({ items, className, ...props }: BentoGridProps) { const prefix = useId(); return <div {...props} className={cx('md-bento-grid', className)}>{items.map((item, index) => <section key={item.id} className="md-glass md-pad-md" data-span={item.span ?? 1} aria-labelledby={`${prefix}-${index}`}><h3 id={`${prefix}-${index}`}>{item.title}</h3><div>{item.content}</div></section>)}</div>; }
