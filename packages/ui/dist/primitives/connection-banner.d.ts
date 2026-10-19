import { type HTMLAttributes } from 'react';
export interface ConnectionBannerProps extends HTMLAttributes<HTMLDivElement> {
    state: 'online' | 'offline' | 'reconnecting';
    onReconnect?: () => void;
}
export declare function ConnectionBanner({ state, onReconnect, className, ...props }: ConnectionBannerProps): import("react").JSX.Element;
