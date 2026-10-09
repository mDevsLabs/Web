// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleActivity, KnowledgeArticleMetric, KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly KnowledgeArticle[];
    onSelect?: (item: KnowledgeArticle) => void;
    emptyMessage?: string;
}
export function KnowledgeArticleList({ onSelect, ...props }: KnowledgeArticleListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as KnowledgeArticle) : undefined}/>; }
