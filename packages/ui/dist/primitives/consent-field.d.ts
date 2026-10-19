import { type ReactNode, type HTMLAttributes } from 'react';
export interface ConsentFieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    children?: ReactNode;
    required?: boolean;
    disabled?: boolean;
    name?: string;
}
export declare function ConsentField({ label, checked, onCheckedChange, children, required, disabled, name, className, ...props }: ConsentFieldProps): import("react").JSX.Element;
