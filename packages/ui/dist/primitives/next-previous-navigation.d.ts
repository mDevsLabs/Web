import { type HTMLAttributes } from 'react';
export interface NextPreviousNavigationProps extends HTMLAttributes<HTMLElement> {
    previous?: {
        href: string;
        label: string;
    };
    next?: {
        href: string;
        label: string;
    };
    label?: string;
}
export declare function NextPreviousNavigation({ previous, next, label, className, ...props }: NextPreviousNavigationProps): import("react").JSX.Element;
