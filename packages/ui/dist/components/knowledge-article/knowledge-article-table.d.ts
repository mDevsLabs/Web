import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticle } from './types.js';
export interface KnowledgeArticleTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly KnowledgeArticle[];
    emptyMessage?: string;
}
export declare function KnowledgeArticleTable(props: KnowledgeArticleTableProps): import("react").JSX.Element;
