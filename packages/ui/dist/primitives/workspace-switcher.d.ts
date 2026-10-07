import { type HTMLAttributes } from 'react';
export interface WorkspaceSwitcherProps extends HTMLAttributes<HTMLDivElement> {
    label: string;
    workspaces: readonly {
        id: string;
        name: string;
        description?: string;
        disabled?: boolean;
    }[];
    value: string;
    onValueChange: (id: string) => void;
    disabled?: boolean;
}
export declare function WorkspaceSwitcher({ label, workspaces, value, onValueChange, disabled, className, ...props }: WorkspaceSwitcherProps): import("react").JSX.Element;
