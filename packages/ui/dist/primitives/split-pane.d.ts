import { type ReactNode, type HTMLAttributes } from 'react';
export interface SplitPaneProps extends HTMLAttributes<HTMLDivElement> {
    primary: ReactNode;
    secondary: ReactNode;
    value: number;
    onValueChange: (percent: number) => void;
    min?: number;
    max?: number;
    label?: string;
}
export declare function SplitPane({ primary, secondary, value, onValueChange, min, max, label, className, style, ...props }: SplitPaneProps): import("react").JSX.Element;
