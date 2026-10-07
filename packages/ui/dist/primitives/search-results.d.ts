import { type HTMLAttributes } from 'react';
export interface SearchResultsProps extends HTMLAttributes<HTMLElement> {
    label: string;
    query: string;
    items: readonly {
        id: string;
        title: string;
        href: string;
        excerpt?: string;
    }[];
    pending?: boolean;
}
export declare function SearchResults({ label, query, items, pending, className, ...props }: SearchResultsProps): import("react").JSX.Element;
