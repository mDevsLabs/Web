'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ConnectionBannerProps extends HTMLAttributes<HTMLDivElement> {
    state: 'online' | 'offline' | 'reconnecting';
    onReconnect?: () => void;
}
export function ConnectionBanner({ state, onReconnect, className, ...props }: ConnectionBannerProps) { const labels = { online: 'Connexion rétablie.', offline: 'Vous êtes hors ligne.', reconnecting: 'Reconnexion en cours…' }; return <div {...props} role="status" className={cx('md-connection-banner', className)} data-state={state}><span>{labels[state]}</span>{onReconnect && state === 'offline' && <button type="button" className="md-button md-button-outline" onClick={onReconnect}>Reconnecter</button>}</div>; }
