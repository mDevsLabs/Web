import { type DomainFrameProps } from '../../internal/domain.js';
export interface CheckoutEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CheckoutEmptyState(props: CheckoutEmptyStateProps): import("react").JSX.Element;
