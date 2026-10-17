import { type ButtonHTMLAttributes } from 'react';
export interface ScrollToTopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    threshold?: number;
}
export declare function ScrollToTopButton({ threshold, children, className, onClick, ...props }: ScrollToTopButtonProps): import("react").JSX.Element;
