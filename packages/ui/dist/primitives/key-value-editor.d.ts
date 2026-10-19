import { type HTMLAttributes } from 'react';
export interface KeyValueEditorProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: readonly {
        id: string;
        key: string;
        value: string;
    }[];
    onValueChange: (value: {
        id: string;
        key: string;
        value: string;
    }[]) => void;
    disabled?: boolean;
}
export declare function KeyValueEditor({ label, value, onValueChange, disabled, className, ...props }: KeyValueEditorProps): import("react").JSX.Element;
