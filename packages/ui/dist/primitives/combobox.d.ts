import { type HTMLAttributes } from 'react';
export interface ComboboxProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    emptyMessage?: string;
}
export declare function Combobox({ label, options, value, onValueChange, disabled, placeholder, emptyMessage, className, ...props }: ComboboxProps): import("react").JSX.Element;
