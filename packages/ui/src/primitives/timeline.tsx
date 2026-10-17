'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
    events: readonly {
        id: string;
        title: string;
        date: string;
        description?: string;
    }[];
}
export function Timeline({ events, className, ...props }: TimelineProps) { return <ol {...props} className={cx('md-timeline', className)}>{events.map(event => <li key={event.id}><span className="md-timeline-dot" aria-hidden="true"/><div><strong>{event.title}</strong>{event.description && <p>{event.description}</p>}<time className="md-muted" dateTime={event.date}>{event.date}</time></div></li>)}</ol>; }
