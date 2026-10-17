import { type ReactNode, type HTMLAttributes } from 'react';
export interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
    items: readonly {
        id: string;
        title: string;
        content: ReactNode;
        span?: 1 | 2;
    }[];
}
export declare function BentoGrid({ items, className, ...props }: BentoGridProps): import("react").JSX.Element;
