import { type DomainFrameProps } from '../../internal/domain.js';
export interface EventEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function EventEmptyState(props: EventEmptyStateProps): import("react").JSX.Element;
