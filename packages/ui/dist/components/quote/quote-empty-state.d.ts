import { type DomainFrameProps } from '../../internal/domain.js';
export interface QuoteEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function QuoteEmptyState(props: QuoteEmptyStateProps): import("react").JSX.Element;
