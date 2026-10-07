import { type InputHTMLAttributes } from 'react';
export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    onValueChange?: (value: number | undefined) => void;
}
export declare const NumberInput: import("react").ForwardRefExoticComponent<NumberInputProps & import("react").RefAttributes<HTMLInputElement>>;
