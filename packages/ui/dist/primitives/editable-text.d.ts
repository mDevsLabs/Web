import { type HTMLAttributes } from 'react';
export interface EditableTextProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string;
    onCommit: (value: string) => void;
    disabled?: boolean;
    emptyLabel?: string;
}
export declare function EditableText({ label, value, onCommit, disabled, emptyLabel, className, ...props }: EditableTextProps): import("react").JSX.Element;
