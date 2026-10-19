'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
}
export function RangeSlider({ label, id, className, ...props }: RangeSliderProps) { const generated = useId(); return <div className="md-field"><label htmlFor={id ?? generated}>{label}</label><input {...props} id={id ?? generated} type="range" className={cx('md-range', className)}/></div>; }
