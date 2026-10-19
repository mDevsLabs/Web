import { type HTMLAttributes } from 'react';
export interface PageSizeSelectProps extends HTMLAttributes<HTMLDivElement> {
    value: number;
    onValueChange: (size: number) => void;
    options?: readonly number[];
    label?: string;
    disabled?: boolean;
}
export declare function PageSizeSelect({ value, onValueChange, options, label, disabled, className, ...props }: PageSizeSelectProps): import("react").JSX.Element;
