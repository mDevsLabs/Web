import { type DomainFrameProps } from '../../internal/domain.js';
export interface KnowledgeArticleEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function KnowledgeArticleEmptyState(props: KnowledgeArticleEmptyStateProps): import("react").JSX.Element;
