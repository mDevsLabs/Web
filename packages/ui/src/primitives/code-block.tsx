'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface CodeBlockProps extends HTMLAttributes<HTMLElement> {
    code: string;
    language?: string;
    label?: string;
    copyLabel?: string;
    onCopied?: () => void;
    onCopyError?: (error: unknown) => void;
}
export function CodeBlock({ code, language = 'text', label = 'Exemple de code', copyLabel = 'Copier le code', onCopied, onCopyError, className, ...props }: CodeBlockProps) { const [message, setMessage] = useState(''); return <figure {...props} className={cx('md-code-block', className)}><figcaption>{label}<span className="md-badge">{language}</span><button type="button" className="md-button md-button-outline" onClick={async () => { try {
    await navigator.clipboard.writeText(code);
    setMessage('Code copié.');
    onCopied?.();
}
catch (error) {
    setMessage('Copie impossible. Sélectionnez le texte.');
    onCopyError?.(error);
} }}>{copyLabel}</button></figcaption><pre tabIndex={0} aria-label={label}><code>{code}</code></pre><p role="status" className="md-muted">{message}</p></figure>; }
