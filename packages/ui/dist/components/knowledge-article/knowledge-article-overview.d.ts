import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticle, KnowledgeArticleMetric } from './types.js';
export interface KnowledgeArticleOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly KnowledgeArticle[];
    metrics: readonly KnowledgeArticleMetric[];
}
export declare function KnowledgeArticleOverview(props: KnowledgeArticleOverviewProps): import("react").JSX.Element;
