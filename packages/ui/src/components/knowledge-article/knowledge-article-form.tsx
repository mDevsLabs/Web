// Generated from scripts/data/domains.txt. One independent export and data contract per module.
'use client';
import { DomainForm, type DomainFrameProps } from '../../internal/domain.js';
import { config } from './config.js';
import type { KnowledgeArticle, KnowledgeArticleStatus, KnowledgeArticleActivity, KnowledgeArticleMetric, KnowledgeArticleSettingsValues } from './types.js';
export interface KnowledgeArticleFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<KnowledgeArticle>;
    onSubmit: (value: Omit<KnowledgeArticle, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export function KnowledgeArticleForm({ onSubmit, ...props }: KnowledgeArticleFormProps) { return <DomainForm config={config} {...props} onSubmit={values => onSubmit(values as Omit<KnowledgeArticle, 'id'>)}/>; }
