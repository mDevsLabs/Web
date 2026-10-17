import { type HTMLAttributes } from 'react';
export interface NavigationMenuProps extends HTMLAttributes<HTMLElement> {
    items: readonly {
        label: string;
        href: string;
        active?: boolean;
    }[];
    label: string;
}
export declare function NavigationMenu({ items, label, className, ...props }: NavigationMenuProps): import("react").JSX.Element;
