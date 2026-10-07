import { type HTMLAttributes } from 'react';
export interface ErrorPanelProps extends HTMLAttributes<HTMLDivElement> {
    heading: string;
    message: string;
    details?: string;
    reference?: string;
}
export declare function ErrorPanel({ heading, message, details, reference, className, ...props }: ErrorPanelProps): import("react").JSX.Element;
