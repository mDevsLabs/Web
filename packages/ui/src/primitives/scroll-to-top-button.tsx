'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ScrollToTopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    threshold?: number;
}
export function ScrollToTopButton({ threshold = 300, children = 'Retour en haut', className, onClick, ...props }: ScrollToTopButtonProps) { const [visible, setVisible] = useState(false); useEffect(() => { const update = () => setVisible(window.scrollY >= threshold); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, [threshold]); return <button {...props} type="button" hidden={!visible} className={cx('md-button md-button-outline md-scroll-top', className)} onClick={event => { onClick?.(event); if (!event.defaultPrevented)
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>{children}</button>; }
