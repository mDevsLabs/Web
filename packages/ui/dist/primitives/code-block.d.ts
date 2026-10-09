import { type HTMLAttributes } from 'react';
export interface CodeBlockProps extends HTMLAttributes<HTMLElement> {
    code: string;
    language?: string;
    label?: string;
    copyLabel?: string;
    onCopied?: () => void;
    onCopyError?: (error: unknown) => void;
}
export declare function CodeBlock({ code, language, label, copyLabel, onCopied, onCopyError, className, ...props }: CodeBlockProps): import("react").JSX.Element;
