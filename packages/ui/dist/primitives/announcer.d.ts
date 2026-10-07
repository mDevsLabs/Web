import { type HTMLAttributes } from 'react';
export interface AnnouncerProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    priority?: 'polite' | 'assertive';
    visible?: boolean;
}
export declare function Announcer({ message, priority, visible, className, ...props }: AnnouncerProps): import("react").JSX.Element;
