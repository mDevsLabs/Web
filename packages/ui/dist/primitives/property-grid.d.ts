import { type HTMLAttributes } from 'react';
export interface PropertyGridProps extends HTMLAttributes<HTMLDivElement> {
    groups: readonly {
        id: string;
        title: string;
        properties: readonly {
            label: string;
            value: string | number;
        }[];
    }[];
}
export declare function PropertyGrid({ groups, className, ...props }: PropertyGridProps): import("react").JSX.Element;
