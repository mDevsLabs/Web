// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { Article, ArticleStatus, ArticleActivity, ArticleMetric, ArticleSettingsValues } from './types.js';
export interface ArticleFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<Article>;
    onSubmit: (value: Omit<Article, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function ArticleForm({ onSubmit, ...props }: ArticleFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<Article, 'id'>)}/>; }
