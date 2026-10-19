// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainCard, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Article, ArticleStatus, ArticleActivity, ArticleMetric, ArticleSettingsValues } from './types.js';
export interface ArticleCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Article;
}
export function ArticleCard(props: ArticleCardProps) { return <DomainCard config={config} {...props}/>; }
