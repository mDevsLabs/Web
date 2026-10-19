import { type HTMLAttributes } from 'react';
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    label?: string;
}
export declare function Pagination({ page, totalPages, onPageChange, label, className, ...props }: PaginationProps): import("react").JSX.Element;
