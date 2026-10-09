// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainTable, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Article, ArticleStatus, ArticleActivity, ArticleMetric, ArticleSettingsValues } from './types.js';
export interface ArticleTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Article[];
    emptyMessage?: string;
}
export function ArticleTable(props: ArticleTableProps) { return <DomainTable config={config} {...props}/>; }
