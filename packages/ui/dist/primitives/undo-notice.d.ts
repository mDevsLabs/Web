import { type HTMLAttributes } from 'react';
export interface UndoNoticeProps extends HTMLAttributes<HTMLDivElement> {
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    pending?: boolean;
}
export declare function UndoNotice({ message, onUndo, onDismiss, pending, className, ...props }: UndoNoticeProps): import("react").JSX.Element;
