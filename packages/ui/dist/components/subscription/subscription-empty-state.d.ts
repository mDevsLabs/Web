import { type DomainFrameProps } from '../../internal/domain.js';
export interface SubscriptionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function SubscriptionEmptyState(props: SubscriptionEmptyStateProps): import("react").JSX.Element;
