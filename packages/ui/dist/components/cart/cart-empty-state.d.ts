import { type DomainFrameProps } from '../../internal/domain.js';
export interface CartEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CartEmptyState(props: CartEmptyStateProps): import("react").JSX.Element;
