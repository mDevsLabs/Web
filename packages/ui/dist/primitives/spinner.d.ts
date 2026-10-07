import { type HTMLAttributes } from 'react';
export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
    label?: string;
}
export declare function Spinner({ label, className, ...props }: SpinnerProps): import("react").JSX.Element;
