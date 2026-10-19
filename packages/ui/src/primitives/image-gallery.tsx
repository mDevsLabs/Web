'use client';
import { Fragment as ReactFragment, createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ButtonHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type FormHTMLAttributes, type AnchorHTMLAttributes, type SVGProps, type ComponentPropsWithoutRef } from 'react';
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RDropdown, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip, Checkbox as RCheckbox, Switch as RSwitch } from 'radix-ui';
import { cx, useControllable } from '../internal/utils.js';
import { ThemeContext, PortalScope } from '../internal/theme.js';
export interface ImageGalleryProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    images: readonly {
        id: string;
        src: string;
        alt: string;
        caption?: string;
    }[];
    value: string;
    onValueChange: (id: string) => void;
}
export function ImageGallery({ label, images, value, onValueChange, className, ...props }: ImageGalleryProps) { const [failed, setFailed] = useState(false); const current = images.find(image => image.id === value) ?? images[0]; useEffect(() => setFailed(false), [current?.src]); return <div {...props} className={cx('md-image-gallery', className)} role="group" aria-label={label}>{current ? <><figure>{failed ? <p role="status">L’image n’a pas pu être chargée : {current.alt}</p> : <img src={current.src} alt={current.alt} onError={() => setFailed(true)}/>}<figcaption>{current.caption ?? current.alt}</figcaption></figure><div className="md-gallery-thumbnails">{images.map(image => <button type="button" key={image.id} aria-label={`Afficher : ${image.alt}`} aria-pressed={image.id === current.id} onClick={() => onValueChange(image.id)}><img src={image.src} alt="" loading="lazy"/></button>)}</div></> : <p>Aucune image.</p>}</div>; }
