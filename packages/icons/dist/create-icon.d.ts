import { type SVGProps } from 'react';
export type IconNode = readonly (readonly [string, Readonly<Record<string, string | number>>])[];
export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    title?: string;
    absoluteStrokeWidth?: boolean;
}
export declare function createIcon(displayName: string, nodes: IconNode): import("react").ForwardRefExoticComponent<Omit<IconProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
