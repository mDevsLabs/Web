'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FileDropzoneProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    onFiles: (files: File[]) => void;
    onRejected?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxBytes?: number;
    disabled?: boolean;
}
export function FileDropzone({ label, onFiles, onRejected, accept, multiple = false, maxBytes = 10 * 1024 * 1024, disabled, className, ...props }: FileDropzoneProps) { const id = useId(); const [dragging, setDragging] = useState(false); const [error, setError] = useState(''); const select = (files: File[]) => { if (disabled)
    return; const candidate = multiple ? files : files.slice(0, 1); const rejected = candidate.filter(file => file.size > maxBytes); const valid = candidate.filter(file => file.size <= maxBytes); setError(rejected.length ? `${rejected.length} fichier(s) dépasse(nt) la taille autorisée.` : ''); if (rejected.length)
    onRejected?.(rejected); if (valid.length)
    onFiles(valid); }; return <div {...props} className={cx('md-dropzone', className)} data-dragging={dragging || undefined} onDragOver={event => { event.preventDefault(); if (!disabled)
    setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null))
    setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); select(Array.from(event.dataTransfer.files)); }}><label htmlFor={id}>{label}</label><p className="md-muted">Déposez ici ou utilisez le sélecteur de fichiers.</p><input id={id} type="file" accept={accept} multiple={multiple} disabled={disabled} aria-describedby={error ? `${id}-error` : undefined} onChange={event => { select(Array.from(event.target.files ?? [])); event.target.value = ''; }}/>{error && <p id={`${id}-error`} role="alert" className="md-field-error">{error}</p>}</div>; }
