import { type HTMLAttributes } from 'react';
export interface ResultSummaryProps extends HTMLAttributes<HTMLParagraphElement> {
    total: number;
    page: number;
    pageSize: number;
    label?: string;
}
export declare function ResultSummary({ total, page, pageSize, label, className, ...props }: ResultSummaryProps): import("react").JSX.Element;
