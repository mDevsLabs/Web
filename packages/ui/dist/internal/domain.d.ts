import { type HTMLAttributes, type ReactNode } from 'react';
export interface DomainField {
    key: string;
    label: string;
    kind: 'text' | 'email' | 'url' | 'date' | 'number' | 'status';
    required?: boolean;
    options?: readonly string[];
}
export interface DomainConfig {
    name: string;
    label: string;
    description: string;
    fields: readonly DomainField[];
    titleKey: string;
    settings: readonly {
        key: string;
        label: string;
        description: string;
    }[];
}
export type DomainRecord = Record<string, string | number | undefined>;
export interface DomainActivity {
    id: string;
    title: string;
    description?: string;
    date: string;
}
export interface DomainMetric {
    id: string;
    label: string;
    value: string | number;
    change?: string;
    tone?: 'neutral' | 'success' | 'warning' | 'danger';
}
export interface DomainFrameProps extends HTMLAttributes<HTMLElement> {
    title?: string;
    description?: string;
    actions?: ReactNode;
}
export declare function DomainCard({ config, item, ...props }: DomainFrameProps & {
    config: DomainConfig;
    item: DomainRecord;
}): import("react").JSX.Element;
export declare function DomainList({ config, items, onSelect, emptyMessage, ...props }: Omit<DomainFrameProps, 'onSelect'> & {
    config: DomainConfig;
    items: readonly DomainRecord[];
    onSelect?: (item: DomainRecord) => void;
    emptyMessage?: string;
}): import("react").JSX.Element;
export declare function DomainTable({ config, items, emptyMessage, ...props }: DomainFrameProps & {
    config: DomainConfig;
    items: readonly DomainRecord[];
    emptyMessage?: string;
}): import("react").JSX.Element;
export declare function DomainForm({ config, initialValues, onSubmit, submitLabel, pending, ...props }: Omit<DomainFrameProps, 'onSubmit'> & {
    config: DomainConfig;
    initialValues?: DomainRecord;
    onSubmit: (value: DomainRecord) => void;
    submitLabel?: string;
    pending?: boolean;
}): import("react").JSX.Element;
export declare function DomainFilters({ config, query, status, onQueryChange, onStatusChange, ...props }: DomainFrameProps & {
    config: DomainConfig;
    query: string;
    status?: string;
    onQueryChange: (value: string) => void;
    onStatusChange?: (value: string) => void;
}): import("react").JSX.Element;
export declare function DomainTimeline({ config, events, emptyMessage, ...props }: DomainFrameProps & {
    config: DomainConfig;
    events: readonly DomainActivity[];
    emptyMessage?: string;
}): import("react").JSX.Element;
export declare function DomainStats({ config, metrics, ...props }: DomainFrameProps & {
    config: DomainConfig;
    metrics: readonly DomainMetric[];
}): import("react").JSX.Element;
export declare function DomainEmptyState({ config, message, actionLabel, onAction, ...props }: DomainFrameProps & {
    config: DomainConfig;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}): import("react").JSX.Element;
export declare function DomainSettings({ config, values, onChange, ...props }: Omit<DomainFrameProps, 'onChange'> & {
    config: DomainConfig;
    values: Record<string, boolean | undefined>;
    onChange: (key: string, value: boolean) => void;
}): import("react").JSX.Element;
export declare function DomainOverview({ config, items, metrics, ...props }: DomainFrameProps & {
    config: DomainConfig;
    items: readonly DomainRecord[];
    metrics: readonly DomainMetric[];
}): import("react").JSX.Element;
