import { type ComponentPropsWithoutRef } from 'react';
export interface MeterProps extends Omit<ComponentPropsWithoutRef<'meter'>, 'children'> {
    label: string;
}
export declare function Meter({ label, className, ...props }: MeterProps): import("react").JSX.Element;
