import { type DomainFrameProps } from '../../internal/domain.js';
export interface GiftCardEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function GiftCardEmptyState(props: GiftCardEmptyStateProps): import("react").JSX.Element;
