'use client';
import { createElement, forwardRef, useId, type SVGProps } from 'react';
export type IconNode = readonly (readonly [
    string,
    Readonly<Record<string, string | number>>
])[];
export interface IconProps extends SVGProps<SVGSVGElement> {
    /** Base viewBox is 0 0 24 24; native props can override it. Size accepts CSS units. */
    size?: number | string;
    title?: string;
    /** Keep strokes fixed in screen units during CSS/SVG scaling. */
    absoluteStrokeWidth?: boolean;
}
export function createIcon(displayName: string, nodes: IconNode) {
    const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ size = 24, title, absoluteStrokeWidth = false, children, strokeWidth = 1.5, color, style, ...props }, ref) {
        const generated = useId();
        const titleId = `${generated}-title`;
        const labelled = Boolean(title || props['aria-label'] || props['aria-labelledby']);
        return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" color={color ?? '#000'} style={{ colorScheme: 'light dark', color: color ?? 'var(--md-icon-color, light-dark(#000, #fff))', ...style }} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" role={labelled ? 'img' : undefined} aria-hidden={labelled ? undefined : true} aria-labelledby={title ? titleId : undefined} focusable="false" {...props} ref={ref}>
      {title && <title id={titleId}>{title}</title>}
      {nodes.map(([tag, attrs], index) => createElement(tag, { ...attrs, ...(absoluteStrokeWidth ? { vectorEffect: 'non-scaling-stroke' } : {}), key: index }))}
      {children}
    </svg>;
    });
    Icon.displayName = displayName;
    return Icon;
}
