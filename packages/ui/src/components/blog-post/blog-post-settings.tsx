// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainSettings, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BlogPost, BlogPostStatus, BlogPostActivity, BlogPostMetric, BlogPostSettingsValues } from './types.js';
export interface BlogPostSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BlogPostSettingsValues;
    onChange: (key: keyof BlogPostSettingsValues, value: boolean) => void;
}
export function BlogPostSettings({ onChange, ...props }: BlogPostSettingsProps) { return <DomainSettings config={config} {...props} onChange={(key, value) => onChange(key as keyof BlogPostSettingsValues, value)}/>; }
