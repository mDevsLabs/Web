import { type HTMLAttributes } from 'react';
export interface FieldArrayProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly {
        id: string;
        value: string;
    }[];
    onValueChange: (value: {
        id: string;
        value: string;
    }[]) => void;
    maxItems?: number;
    disabled?: boolean;
}
export declare function FieldArray({ label, value, onValueChange, maxItems, disabled, className, ...props }: FieldArrayProps): import("react").JSX.Element;
