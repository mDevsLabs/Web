import { type HTMLAttributes } from 'react';
export interface FileDropzoneProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    onFiles: (files: File[]) => void;
    onRejected?: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxBytes?: number;
    disabled?: boolean;
}
export declare function FileDropzone({ label, onFiles, onRejected, accept, multiple, maxBytes, disabled, className, ...props }: FileDropzoneProps): import("react").JSX.Element;
