import { type HTMLAttributes } from 'react';
export interface FacetFilterProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        count: number;
        disabled?: boolean;
    }[];
    value: readonly string[];
    onValueChange: (value: string[]) => void;
}
export declare function FacetFilter({ label, options, value, onValueChange, className, ...props }: FacetFilterProps): import("react").JSX.Element;
