import { type HTMLAttributes } from 'react';
export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
    label: string;
    name: string;
    options: readonly {
        value: string;
        label: string;
        disabled?: boolean;
    }[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}
export declare function RadioGroup({ label, name, options, value, defaultValue, onValueChange, className, ...props }: RadioGroupProps): import("react").JSX.Element;
