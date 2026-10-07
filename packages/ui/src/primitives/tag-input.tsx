'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface TagInputProps {
    value: readonly string[];
    onValueChange: (tags: string[]) => void;
    label: string;
    placeholder?: string;
}
export function TagInput({ value, onValueChange, label, placeholder = 'Ajouter une étiquette' }: TagInputProps) { const [input, setInput] = useState(''); const id = useId(); return <div className="md-field"><label htmlFor={id}>{label}</label><div className="md-tags">{value.map(tag => <span className="md-badge" key={tag}>{tag}<button type="button" aria-label={`Supprimer ${tag}`} onClick={() => onValueChange(value.filter(t => t !== tag))}>×</button></span>)}<input id={id} className="md-input" value={input} placeholder={placeholder} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
    e.preventDefault();
    const tag = input.trim();
    if (tag && !value.includes(tag))
        onValueChange([...value, tag]);
    setInput('');
} }}/></div><p className="md-muted">Appuyez sur Entrée pour ajouter.</p></div>; }
