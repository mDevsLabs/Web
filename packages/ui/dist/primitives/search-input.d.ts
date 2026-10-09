import { type InputHTMLAttributes } from 'react';
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
    onValueChange?: (value: string) => void;
    label?: string;
}
export declare const SearchInput: import("react").ForwardRefExoticComponent<SearchInputProps & import("react").RefAttributes<HTMLInputElement>>;
