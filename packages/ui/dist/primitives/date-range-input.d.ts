import { type HTMLAttributes } from 'react';
export interface DateRangeInputProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: {
        start: string;
        end: string;
    };
    onValueChange: (value: {
        start: string;
        end: string;
    }) => void;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
}
export declare function DateRangeInput({ label, value, onValueChange, min, max, required, disabled, className, ...props }: DateRangeInputProps): import("react").JSX.Element;
