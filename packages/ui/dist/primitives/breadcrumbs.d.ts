import { type HTMLAttributes } from 'react';
export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
    items: readonly {
        label: string;
        href?: string;
    }[];
    label?: string;
}
export declare function Breadcrumbs({ items, label, className, ...props }: BreadcrumbsProps): import("react").JSX.Element;
