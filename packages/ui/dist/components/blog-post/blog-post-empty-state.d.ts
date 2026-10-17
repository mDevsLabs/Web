import { type DomainFrameProps } from '../../internal/domain.js';
export interface BlogPostEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function BlogPostEmptyState(props: BlogPostEmptyStateProps): import("react").JSX.Element;
