// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleActivity, KnowledgeArticleMetric, KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: KnowledgeArticleStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: KnowledgeArticleStatus | '') => void;
}
export function KnowledgeArticleFilters({ onStatusChange, ...props }: KnowledgeArticleFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as KnowledgeArticleStatus | '') : undefined}/>; }
