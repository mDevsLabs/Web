import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticle } from './types.js';
export interface KnowledgeArticleListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly KnowledgeArticle[];
    onSelect?: (item: KnowledgeArticle) => void;
    emptyMessage?: string;
}
export declare function KnowledgeArticleList({ onSelect, ...props }: KnowledgeArticleListProps): import("react").JSX.Element;
