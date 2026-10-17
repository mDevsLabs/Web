import { type HTMLAttributes } from 'react';
export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    htmlFor: string;
    hint?: string;
    error?: string;
}
export declare function Field({ label, htmlFor, hint, error, className, children, ...props }: FieldProps): import("react").JSX.Element;
