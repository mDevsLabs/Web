import { type HTMLAttributes } from 'react';
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
}
export declare function Heading({ level, className, ...props }: HeadingProps): import("react").JSX.Element;
