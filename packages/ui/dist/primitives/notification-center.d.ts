export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    date: string;
    read?: boolean;
}
export interface NotificationCenterProps {
    notifications: readonly NotificationItem[];
    onMarkRead?: (id: string) => void;
    label?: string;
}
export declare function NotificationCenter({ notifications, onMarkRead, label }: NotificationCenterProps): import("react").JSX.Element;
