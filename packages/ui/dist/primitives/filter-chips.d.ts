import { type HTMLAttributes } from 'react';
export interface FilterChipsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    filters: readonly {
        id: string;
        label: string;
    }[];
    onRemove: (id: string) => void;
    onClear?: () => void;
}
export declare function FilterChips({ label, filters, onRemove, onClear, className, ...props }: FilterChipsProps): import("react").JSX.Element;
