import { type HTMLAttributes } from 'react';
export interface PasswordRequirementsProps extends HTMLAttributes<HTMLDivElement> {
    value: string;
    minLength?: number;
    label?: string;
}
export declare function PasswordRequirements({ value, minLength, label, className, ...props }: PasswordRequirementsProps): import("react").JSX.Element;
