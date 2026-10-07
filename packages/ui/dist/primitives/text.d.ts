import { type HTMLAttributes } from 'react';
export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: 'default' | 'muted' | 'danger' | 'success';
}
export declare function Text({ tone, className, ...props }: TextProps): import("react").JSX.Element;
