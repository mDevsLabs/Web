// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTimeline, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleActivity, KnowledgeArticleMetric, KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly KnowledgeArticleActivity[];
    emptyMessage?: string;
}
export function KnowledgeArticleTimeline(props: KnowledgeArticleTimelineProps) { return <DomainTimeline config={config} {...props}/>; }
