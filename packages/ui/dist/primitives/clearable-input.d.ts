import { type InputHTMLAttributes } from 'react';
export interface ClearableInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    clearLabel?: string;
}
export declare function ClearableInput({ label, value, onValueChange, clearLabel, id: givenId, disabled, className, ...props }: ClearableInputProps): import("react").JSX.Element;
