import { type ReactNode } from 'react';
export interface ConfirmDialogProps {
    title: string;
    description: string;
    trigger: ReactNode;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
}
export declare function ConfirmDialog({ title, description, trigger, onConfirm, confirmLabel, cancelLabel }: ConfirmDialogProps): import("react").JSX.Element;
