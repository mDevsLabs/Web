import { type DomainFrameProps } from '../../internal/domain.js';
export interface CollectionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CollectionEmptyState(props: CollectionEmptyStateProps): import("react").JSX.Element;
