'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    date: string;
    read?: boolean;
}
export interface NotificationCenterProps {
    notifications: readonly NotificationItem[];
    onMarkRead?: (id: string) => void;
    label?: string;
}
export function NotificationCenter({ notifications, onMarkRead, label = 'Notifications' }: NotificationCenterProps) { return <section className="md-glass md-card" aria-label={label}><h3>{label}</h3>{notifications.length ? <ul className="md-item-list">{notifications.map(n => <li key={n.id}><strong>{n.title}</strong>{n.description && <p>{n.description}</p>}<time className="md-muted" dateTime={n.date}>{n.date}</time>{!n.read && <><span className="md-badge">Non lue</span>{onMarkRead && <button type="button" className="md-button md-button-ghost" onClick={() => onMarkRead(n.id)}>Marquer comme lue</button>}</>}</li>)}</ul> : <p className="md-muted">Aucune notification.</p>}</section>; }
