import { type ReactNode, type HTMLAttributes } from 'react';
export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title: string;
    description?: string;
    breadcrumbs?: ReactNode;
    actions?: ReactNode;
    headingLevel?: 1 | 2;
}
export declare function PageHeader({ title, description, breadcrumbs, actions, headingLevel, className, ...props }: PageHeaderProps): import("react").JSX.Element;
