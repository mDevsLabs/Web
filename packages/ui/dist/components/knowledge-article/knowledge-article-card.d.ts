import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticle } from './types.js';
export interface KnowledgeArticleCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: KnowledgeArticle;
}
export declare function KnowledgeArticleCard(props: KnowledgeArticleCardProps): import("react").JSX.Element;
