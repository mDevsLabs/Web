import { type SVGProps } from 'react';
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
export declare function createIcon(displayName: string, nodes: IconNode): import("react").ForwardRefExoticComponent<Omit<IconProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
