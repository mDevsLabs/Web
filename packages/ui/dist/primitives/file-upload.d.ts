import { type InputHTMLAttributes } from 'react';
export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
    label: string;
    onFilesChange?: (files: File[]) => void;
}
export declare function FileUpload({ label, onFilesChange, id, className, ...props }: FileUploadProps): import("react").JSX.Element;
