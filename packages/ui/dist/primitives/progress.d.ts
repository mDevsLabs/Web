import { type HTMLAttributes } from 'react';
export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    value?: number;
    max?: number;
    label: string;
}
export declare function Progress({ value, max, label, className, ...props }: ProgressProps): import("react").JSX.Element;
