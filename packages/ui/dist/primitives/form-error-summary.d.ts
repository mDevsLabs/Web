import { type HTMLAttributes } from 'react';
export interface FormErrorSummaryProps extends HTMLAttributes<HTMLDivElement> {
    errors: readonly {
        fieldId: string;
        message: string;
    }[];
    heading?: string;
}
export declare function FormErrorSummary({ errors, heading, className, ...props }: FormErrorSummaryProps): import("react").JSX.Element | null;
