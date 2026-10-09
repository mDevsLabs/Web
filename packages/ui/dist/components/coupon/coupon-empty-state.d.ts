import { type DomainFrameProps } from '../../internal/domain.js';
export interface CouponEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CouponEmptyState(props: CouponEmptyStateProps): import("react").JSX.Element;
