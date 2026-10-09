import { type DomainFrameProps } from '../../internal/domain.js';
export interface ArticleEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ArticleEmptyState(props: ArticleEmptyStateProps): import("react").JSX.Element;
