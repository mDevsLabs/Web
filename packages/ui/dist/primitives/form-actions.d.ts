import { type HTMLAttributes } from 'react';
export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
    status?: string;
}
export declare function FormActions({ status, children, className, ...props }: FormActionsProps): import("react").JSX.Element;
