import { type DomainFrameProps } from '../../internal/domain.js';
export interface MonitorEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function MonitorEmptyState(props: MonitorEmptyStateProps): import("react").JSX.Element;
