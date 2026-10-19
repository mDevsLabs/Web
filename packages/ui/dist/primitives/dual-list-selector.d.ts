import { type HTMLAttributes } from 'react';
export interface DualListSelectorProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
    disabled?: boolean;
}
export declare function DualListSelector({ label, options, value, onValueChange, disabled, className, ...props }: DualListSelectorProps): import("react").JSX.Element;
