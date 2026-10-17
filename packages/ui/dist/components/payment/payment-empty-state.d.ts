import { type DomainFrameProps } from '../../internal/domain.js';
export interface PaymentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function PaymentEmptyState(props: PaymentEmptyStateProps): import("react").JSX.Element;
