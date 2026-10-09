import { type HTMLAttributes } from 'react';
export interface CountdownProps extends HTMLAttributes<HTMLSpanElement> {
    seconds: number;
    label?: string;
    onElapsed?: () => void;
}
export declare function Countdown({ seconds, label, onElapsed, className, ...props }: CountdownProps): import("react").JSX.Element;
