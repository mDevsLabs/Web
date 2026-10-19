import { type DomainFrameProps } from '../../internal/domain.js';
export interface WebhookEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function WebhookEmptyState(props: WebhookEmptyStateProps): import("react").JSX.Element;
