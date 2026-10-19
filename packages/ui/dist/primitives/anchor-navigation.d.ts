import { type HTMLAttributes } from 'react';
export interface AnchorNavigationProps extends HTMLAttributes<HTMLElement> {
    label: string;
    items: readonly {
        id: string;
        label: string;
    }[];
    activeId?: string;
}
export declare function AnchorNavigation({ label, items, activeId, className, ...props }: AnchorNavigationProps): import("react").JSX.Element;
