'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface EditableTextProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string;
    onCommit: (value: string) => void;
    disabled?: boolean;
    emptyLabel?: string;
}
export function EditableText({ label, value, onCommit, disabled, emptyLabel = 'Ajouter un texte', className, ...props }: EditableTextProps) { const id = useId(); const button = useRef<HTMLButtonElement>(null); const input = useRef<HTMLInputElement>(null); const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(value); const wasEditing = useRef(false); useEffect(() => { if (editing)
    input.current?.focus();
else if (wasEditing.current)
    button.current?.focus(); wasEditing.current = editing; }, [editing]); const close = () => setEditing(false); return <div {...props} className={cx('md-editable-text', className)}>{editing ? <form onSubmit={event => { event.preventDefault(); onCommit(draft.trim()); close(); }}><label className="md-field" htmlFor={id}>{label}<input ref={input} id={id} className="md-input" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') {
    event.preventDefault();
    close();
} }}/></label><div className="md-cluster"><button type="submit" className="md-button">Valider</button><button type="button" className="md-button md-button-outline" onClick={close}>Annuler</button></div></form> : <button ref={button} className="md-button md-button-ghost" type="button" disabled={disabled} aria-label={`Modifier : ${label}`} onClick={() => { setDraft(value); setEditing(true); }}>{value || emptyLabel}</button>}</div>; }
