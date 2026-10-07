import { type HTMLAttributes } from 'react';
export interface SidebarNavigationProps extends HTMLAttributes<HTMLElement> {
    label: string;
    sections: readonly {
        id: string;
        label: string;
        items: readonly {
            id: string;
            label: string;
            href: string;
            count?: number;
        }[];
    }[];
    currentId?: string;
}
export declare function SidebarNavigation({ label, sections, currentId, className, ...props }: SidebarNavigationProps): import("react").JSX.Element;
