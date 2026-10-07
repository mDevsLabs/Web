import { type HTMLAttributes } from 'react';
export interface RangePairInputProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly [
        number,
        number
    ];
    onValueChange: (value: [
        number,
        number
    ]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}
export declare function RangePairInput({ label, value, onValueChange, min, max, step, disabled, className, ...props }: RangePairInputProps): import("react").JSX.Element;
