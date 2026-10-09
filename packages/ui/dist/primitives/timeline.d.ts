import { type HTMLAttributes } from 'react';
export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
    events: readonly {
        id: string;
        title: string;
        date: string;
        description?: string;
    }[];
}
export declare function Timeline({ events, className, ...props }: TimelineProps): import("react").JSX.Element;
