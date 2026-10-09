import { type HTMLAttributes } from 'react';
export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
}
export declare function ButtonGroup({ label, className, ...props }: ButtonGroupProps): import("react").JSX.Element;
