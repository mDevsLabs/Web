import { type ReactNode } from 'react';
export interface AccordionProps {
    items: readonly {
        id: string;
        title: string;
        content: ReactNode;
        disabled?: boolean;
    }[];
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}
export declare function Accordion({ items, ...props }: AccordionProps): import("react").JSX.Element;
