import { type AnchorHTMLAttributes } from 'react';
export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    targetId?: string;
}
export declare function SkipLink({ targetId, children, className, ...props }: SkipLinkProps): import("react").JSX.Element;
