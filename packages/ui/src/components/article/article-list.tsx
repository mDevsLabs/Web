// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Article, ArticleStatus, ArticleActivity, ArticleMetric, ArticleSettingsValues } from './types.js';
export interface ArticleListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Article[];
    onSelect?: (item: Article) => void;
    emptyMessage?: string;
}
export function ArticleList({ onSelect, ...props }: ArticleListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as Article) : undefined}/>; }
