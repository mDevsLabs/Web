'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface UploadProgressProps {
    name: string;
    progress: number;
    status?: 'uploading' | 'complete' | 'error';
    onCancel?: () => void;
}
export function UploadProgress({ name, progress, status = 'uploading', onCancel }: UploadProgressProps) { const value = Math.max(0, Math.min(100, progress)); return <div className="md-glass md-upload-progress"><div className="md-domain-heading"><strong>{name}</strong><span>{status === 'error' ? 'Échec' : status === 'complete' ? 'Terminé' : `${Math.round(value)} %`}</span></div><div role="progressbar" aria-label={name} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="md-progress"><span style={{ width: `${value}%` }}/></div>{onCancel && status === 'uploading' && <button type="button" className="md-button md-button-ghost" onClick={onCancel}>Annuler</button>}</div>; }
