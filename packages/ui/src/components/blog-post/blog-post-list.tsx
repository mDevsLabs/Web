// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainList, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BlogPost, BlogPostStatus, BlogPostActivity, BlogPostMetric, BlogPostSettingsValues } from './types.js';
export interface BlogPostListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly BlogPost[];
    onSelect?: (item: BlogPost) => void;
    emptyMessage?: string;
}
export function BlogPostList({ onSelect, ...props }: BlogPostListProps) { return <DomainList config={config} {...props} onSelect={onSelect ? item => onSelect(item as BlogPost) : undefined}/>; }
