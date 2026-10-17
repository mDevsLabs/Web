import { type ReactNode, type HTMLAttributes } from 'react';
export interface BusyRegionProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    busy: boolean;
    busyMessage?: string;
    children?: ReactNode;
}
export declare function BusyRegion({ label, busy, busyMessage, children, className, ...props }: BusyRegionProps): import("react").JSX.Element;
