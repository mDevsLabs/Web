import { type DomainFrameProps } from '../../internal/domain.js';
export interface TransactionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TransactionEmptyState(props: TransactionEmptyStateProps): import("react").JSX.Element;
