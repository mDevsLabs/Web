import { type HTMLAttributes } from 'react';
export interface FormSectionProps extends HTMLAttributes<HTMLFieldSetElement> {
    legend: string;
    hint?: string;
    disabled?: boolean;
}
export declare function FormSection({ legend, hint, children, className, ...props }: FormSectionProps): import("react").JSX.Element;
