import { type InputHTMLAttributes } from 'react';
export interface OtpInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'maxLength'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    length?: number;
}
export declare function OtpInput({ label, value, onValueChange, length, id: givenId, className, ...props }: OtpInputProps): import("react").JSX.Element;
