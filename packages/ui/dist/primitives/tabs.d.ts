import { type ReactNode } from 'react';
export interface TabsProps {
    items: readonly {
        id: string;
        label: string;
        content: ReactNode;
        disabled?: boolean;
    }[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label: string;
}
export declare function Tabs({ items, label, defaultValue, ...props }: TabsProps): import("react").JSX.Element;
