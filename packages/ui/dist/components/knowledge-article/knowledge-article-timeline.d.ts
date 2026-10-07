import { type DomainFrameProps } from '../../internal/domain.js';
import type { KnowledgeArticleActivity } from './types.js';
export interface KnowledgeArticleTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly KnowledgeArticleActivity[];
    emptyMessage?: string;
}
export declare function KnowledgeArticleTimeline(props: KnowledgeArticleTimelineProps): import("react").JSX.Element;
