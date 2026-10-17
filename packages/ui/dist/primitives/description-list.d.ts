import { type ReactNode, type HTMLAttributes } from 'react';
export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
    items: readonly {
        label: string;
        value: ReactNode;
    }[];
}
export declare function DescriptionList({ items, className, ...props }: DescriptionListProps): import("react").JSX.Element;
