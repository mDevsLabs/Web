import { type HTMLAttributes } from 'react';
export interface SearchFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    onSearch: (query: string) => void;
    pending?: boolean;
    placeholder?: string;
}
export declare function SearchField({ label, value, onValueChange, onSearch, pending, placeholder, className, ...props }: SearchFieldProps): import("react").JSX.Element;
