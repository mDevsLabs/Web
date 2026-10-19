import { type DomainFrameProps } from '../../internal/domain.js';
export interface StorageBucketEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function StorageBucketEmptyState(props: StorageBucketEmptyStateProps): import("react").JSX.Element;
