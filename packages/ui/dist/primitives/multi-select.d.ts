import { type HTMLAttributes } from 'react';
export interface MultiSelectProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    disabled?: boolean;
}
export declare function MultiSelect({ label, options, value, onValueChange, disabled, className, ...props }: MultiSelectProps): import("react").JSX.Element;
