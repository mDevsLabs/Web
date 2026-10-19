// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainStats, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BlogPost, BlogPostStatus, BlogPostActivity, BlogPostMetric, BlogPostSettingsValues } from './types.js';
export interface BlogPostStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly BlogPostMetric[];
}
export function BlogPostStats(props: BlogPostStatsProps) { return <DomainStats config={config} {...props}/>; }
