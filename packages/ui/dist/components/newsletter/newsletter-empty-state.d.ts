import { type DomainFrameProps } from '../../internal/domain.js';
export interface NewsletterEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function NewsletterEmptyState(props: NewsletterEmptyStateProps): import("react").JSX.Element;
