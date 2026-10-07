export interface MobileNavigationProps {
    label: string;
    items: readonly {
        id: string;
        label: string;
        href: string;
    }[];
    currentId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}
export declare function MobileNavigation({ label, items, currentId, open, onOpenChange }: MobileNavigationProps): import("react").JSX.Element;
