import { type DomainFrameProps } from '../../internal/domain.js';
export interface OrderEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function OrderEmptyState(props: OrderEmptyStateProps): import("react").JSX.Element;
