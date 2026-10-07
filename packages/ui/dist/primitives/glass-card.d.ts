import { type ReactNode, type HTMLAttributes } from 'react';
export interface GlassCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    actions?: ReactNode;
}
export declare function GlassCard({ title, description, footer, actions, children, className, ...props }: GlassCardProps): import("react").JSX.Element;
