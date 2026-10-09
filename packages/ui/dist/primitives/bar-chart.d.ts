import { type HTMLAttributes } from 'react';
export interface BarChartProps extends HTMLAttributes<HTMLElement> {
    title: string;
    items: readonly {
        id: string;
        label: string;
        value: number;
    }[];
    unit?: string;
}
export declare function BarChart({ title, items, unit, className, ...props }: BarChartProps): import("react").JSX.Element;
