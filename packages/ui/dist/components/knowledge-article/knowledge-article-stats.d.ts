import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticleMetric } from './types.js';
export interface KnowledgeArticleStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly KnowledgeArticleMetric[];
}
export declare function KnowledgeArticleStats(props: KnowledgeArticleStatsProps): import("react").JSX.Element;
