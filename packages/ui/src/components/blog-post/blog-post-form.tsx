// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { BlogPost, BlogPostStatus, BlogPostActivity, BlogPostMetric, BlogPostSettingsValues } from './types.js';
export interface BlogPostFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<BlogPost>;
    onSubmit: (value: Omit<BlogPost, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function BlogPostForm({ onSubmit, ...props }: BlogPostFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<BlogPost, 'id'>)}/>; }
