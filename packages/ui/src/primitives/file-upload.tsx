'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
    label: string;
    onFilesChange?: (files: File[]) => void;
}
export function FileUpload({ label, onFilesChange, id, className, ...props }: FileUploadProps) { const generated = useId(); const [names, setNames] = useState<string[]>([]); return <div className={cx('md-upload md-glass', className)}><label htmlFor={id ?? generated}>{label}</label><input {...props} id={id ?? generated} type="file" onChange={e => { const files = Array.from(e.target.files ?? []); setNames(files.map(f => f.name)); onFilesChange?.(files); }}/>{names.length > 0 && <ul>{names.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ul>}</div>; }
