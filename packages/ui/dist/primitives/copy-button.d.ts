import { type ButtonHTMLAttributes } from 'react';
export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onCopy'> {
    value: string;
    onCopied?: () => void;
    onError?: (error: unknown) => void;
}
export declare function CopyButton({ value, onCopied, onError, children, className, ...props }: CopyButtonProps): import("react").JSX.Element;
