import { type HTMLAttributes } from 'react';
export interface ChoiceCardsProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    options: readonly {
        value: string;
        label: string;
        description?: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}
export declare function ChoiceCards({ label, options, value, onValueChange, disabled, className, ...props }: ChoiceCardsProps): import("react").JSX.Element;
