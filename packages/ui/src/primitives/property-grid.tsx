'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface PropertyGridProps extends HTMLAttributes<HTMLDivElement> {
    groups: readonly {
        id: string;
        title: string;
        properties: readonly {
            label: string;
            value: string | number;
        }[];
    }[];
}
export function PropertyGrid({ groups, className, ...props }: PropertyGridProps) { const id = useId(); return <div {...props} className={cx('md-property-grid', className)}>{groups.map((group, index) => <section key={group.id} className="md-glass md-pad-md" aria-labelledby={`${id}-${index}`}><h3 id={`${id}-${index}`}>{group.title}</h3><dl>{group.properties.map((property, position) => <div key={`${property.label}-${position}`}><dt>{property.label}</dt><dd>{property.value}</dd></div>)}</dl></section>)}</div>; }
