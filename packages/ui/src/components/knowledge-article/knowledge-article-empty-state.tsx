// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainEmptyState, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleActivity, KnowledgeArticleMetric, KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export function KnowledgeArticleEmptyState(props: KnowledgeArticleEmptyStateProps) { return <DomainEmptyState config={config} {...props}/>; }
