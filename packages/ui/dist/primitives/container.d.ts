import { type HTMLAttributes } from 'react';
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    maxWidth?: number | string;
}
export declare function Container({ maxWidth, className, style, ...props }: ContainerProps): import("react").JSX.Element;
