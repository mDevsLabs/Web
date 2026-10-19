import { type ReactNode } from 'react';
export interface ToastMessage {
    id: string;
    title: string;
    description?: string;
    tone?: 'info' | 'success' | 'warning' | 'danger';
}
export interface ToastInput extends Omit<ToastMessage, 'id'> {
    duration?: number;
}
export declare function useToast(): {
    notify: (message: ToastInput) => string;
    dismiss: (id: string) => void;
};
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
