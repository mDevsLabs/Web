// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainFilters, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BlogPost, BlogPostStatus, BlogPostActivity, BlogPostMetric, BlogPostSettingsValues } from './types.js';
export interface BlogPostFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BlogPostStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BlogPostStatus | '') => void;
}
export function BlogPostFilters({ onStatusChange, ...props }: BlogPostFiltersProps) { return <DomainFilters config={config} {...props} onStatusChange={onStatusChange ? value => onStatusChange(value as BlogPostStatus | '') : undefined}/>; }
