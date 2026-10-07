'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    tone?: 'info' | 'success' | 'warning' | 'danger';
}
export interface ToastInput extends Omit<ToastMessage, 'id'> {
    duration?: number;
}
const ToastContext = createContext<{
    notify: (message: ToastInput) => string;
    dismiss: (id: string) => void;
} | null>(null);
export function useToast() { const context = useContext(ToastContext); if (!context)
    throw new Error('useToast requires ToastProvider'); return context; }
export function ToastProvider({ children }: {
    children: ReactNode;
}) { const [messages, setMessages] = useState<ToastMessage[]>([]); const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>()); const sequence = useRef(0); const prefix = useId(); function dismiss(id: string) { clearTimeout(timers.current.get(id)); timers.current.delete(id); setMessages(previous => previous.filter(m => m.id !== id)); } useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []); function notify(input: ToastInput) { const id = `${prefix}-${++sequence.current}`; setMessages(previous => [...previous.slice(-2), { ...input, id }]); if ((input.duration ?? 5000) > 0)
    timers.current.set(id, setTimeout(() => dismiss(id), input.duration ?? 5000)); return id; } return <ToastContext.Provider value={{ notify, dismiss }}>{children}<div className="md-toasts" aria-live="polite" aria-atomic="false" aria-relevant="additions"><ol>{messages.map(message => <li key={message.id} className="md-glass md-toast" data-tone={message.tone}><div><strong>{message.title}</strong>{message.description && <p>{message.description}</p>}</div><button type="button" className="md-close" aria-label="Fermer la notification" onClick={() => dismiss(message.id)}>×</button></li>)}</ol></div></ToastContext.Provider>; }
