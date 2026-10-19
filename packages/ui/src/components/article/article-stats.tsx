// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Article, ArticleStatus, ArticleActivity, ArticleMetric, ArticleSettingsValues } from './types.js';
export interface ArticleStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ArticleMetric[];
}
export function ArticleStats(props: ArticleStatsProps) { return <DomainStats config={config} {...props}/>; }
