'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    onValueChange?: (value: string) => void;
    label?: string;
}
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput({ onValueChange, label = 'Rechercher', className, ...props }, ref) { return <div className="md-search"><span aria-hidden="true">⌕</span><input {...props} ref={ref} type="search" aria-label={label} className={cx('md-input', className)} onChange={e => onValueChange?.(e.target.value)}/></div>; });
